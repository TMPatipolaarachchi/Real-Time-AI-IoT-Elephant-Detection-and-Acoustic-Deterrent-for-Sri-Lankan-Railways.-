// ESP32 GPS Receiver with Multiple Pillars & Bulk Import
// Supports spreadsheet-style bulk import with front/back distances
// Data stored in LittleFS (persistent flash storage)

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <math.h>

// WiFi credentials - CHANGE THESE
const char* ssid = "Dialog 4G 442";
const char* password = "4A6660AD";

WebServer server(80);

// Pillar structure
struct Pillar {
  String id;
  String name;
  double lat;
  double lon;
  bool active;
  bool elephantDetected; // TRUE if elephant detected at this pillar
  String detectedAt; // Timestamp when elephant was detected
};

// Waypoint structure
struct Waypoint {
  int id;
  int index;
  int trackPathId;
  double lat;
  double lon;
  int front;           // Distance after pillar (meters)
  int frontTotal;      // Cumulative distance after pillar
  int back;            // Distance before pillar (meters)
  int backTotal;       // Cumulative distance before pillar
  String pillarId;
  String description;
};

// Storage arrays
const int MAX_PILLARS = 50;
const int MAX_WAYPOINTS = 200;
Pillar pillars[MAX_PILLARS];
int pillarCount = 0;
Waypoint waypoints[MAX_WAYPOINTS];
int waypointCount = 0;

// Train location
double trainLat = 0.0;
double trainLon = 0.0;
bool trainDataReceived = false;

// System control
bool systemEnabled = true;

// File paths for LittleFS storage
const char* PILLARS_FILE = "/pillars.json";
const char* WAYPOINTS_FILE = "/waypoints.json";

// === Web Interface HTML ===
const char WEB_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESP32 Pillar Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { color: #667eea; margin-bottom: 10px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card .number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-card .label { color: #666; margin-top: 5px; }
        .section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .section h2 { color: #667eea; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #667eea; color: white; }
        tr:hover { background: #f5f5f5; }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .btn-success { background: #4CAF50; color: white; }
        .btn:hover { opacity: 0.8; }
        textarea {
            width: 100%;
            min-height: 200px;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
        }
        .alert {
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-error { background: #f8d7da; color: #721c24; }
        .alert-info { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐘 ESP32 Pillar Manager</h1>
            <p>Direct ESP32 Management Interface</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="number" id="pillar-count">0</div>
                <div class="label">Pillars</div>
            </div>
            <div class="stat-card">
                <div class="number" id="waypoint-count">0</div>
                <div class="label">Waypoints</div>
            </div>
            <div class="stat-card">
                <div class="number" id="status">Checking...</div>
                <div class="label">Status</div>
            </div>
            <div class="stat-card" style="cursor: pointer;" onclick="toggleSystem()">
                <div class="number" id="system-status" style="font-size: 3em;">🟢</div>
                <div class="label" id="system-label">System ON</div>
            </div>
        </div>

        <div class="section">
            <h2>📦 Bulk Import from Excel</h2>
            <p>Paste your Excel data (tab or comma separated)</p>
            <textarea id="bulk-data" placeholder="index	Track path	latitude	longitude	Piller name	front	front total	back	back total
1	1	8.750642	80.49695			600	3100		
2	1	8.749883	80.49681			500	3000"></textarea>
            <button class="btn btn-success" onclick="importBulk()">📊 Import to ESP32</button>
            <button class="btn btn-primary" onclick="loadData()">🔄 Refresh Data</button>
            <button class="btn btn-danger" onclick="clearAll()">🗑️ Clear All</button>
            <div id="import-alert"></div>
        </div>

        <div class="section">
            <h2>📍 Pillars</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Waypoints</th>
                        <th>Status</th>
                        <th>Elephant</th>
                        <th>Detected At</th>
                    </tr>
                </thead>
                <tbody id="pillar-list">
                    <tr><td colspan="8" style="text-align: center; color: #999;">Loading...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🗺️ Waypoints</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Pillar</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Distance</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody id="waypoint-list">
                    <tr><td colspan="6" style="text-align: center; color: #999;">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let pillars = [];
        let waypoints = [];
        let systemEnabled = true;

        async function loadData() {
            try {
                const [pillarsRes, waypointsRes, statusRes] = await Promise.all([
                    fetch('/pillars'),
                    fetch('/waypoints'),
                    fetch('/status')
                ]);

                const pillarsData = await pillarsRes.json();
                const waypointsData = await waypointsRes.json();
                const statusData = await statusRes.json();

                pillars = pillarsData.pillars || [];
                waypoints = waypointsData.waypoints || [];
                systemEnabled = statusData.systemEnabled || false;

                document.getElementById('pillar-count').textContent = pillars.length;
                document.getElementById('waypoint-count').textContent = waypoints.length;
                document.getElementById('status').textContent = '✅ Online';
                document.getElementById('status').style.color = '#4CAF50';
                
                updateSystemStatus();

                updatePillarTable();
                updateWaypointTable();
            } catch (error) {
                document.getElementById('status').textContent = '❌ Error';
                document.getElementById('status').style.color = '#f44336';
                console.error(error);
            }
        }

        function updatePillarTable() {
            const tbody = document.getElementById('pillar-list');
            if (pillars.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No pillars</td></tr>';
                return;
            }

            tbody.innerHTML = pillars.map(p => {
                const wpCount = waypoints.filter(w => w.pillarId === p.id).length;
                const detectedTime = p.detectedAt || 'Never';
                return `
                    <tr>
                        <td><strong>${p.id}</strong></td>
                        <td>${p.name}</td>
                        <td>${p.lat.toFixed(6)}</td>
                        <td>${p.lon.toFixed(6)}</td>
                        <td>${wpCount}</td>
                        <td>
                            <button class="btn ${p.active ? 'btn-success' : 'btn-danger'}" 
                                    onclick='togglePillarStatus("${p.id}")'>
                                ${p.active ? '✓ ON' : '✗ OFF'}
                            </button>
                        </td>
                        <td>
                            <button class="btn ${p.elephantDetected ? 'btn-danger' : 'btn-success'}" 
                                    onclick='toggleElephant("${p.id}")'>
                                ${p.elephantDetected ? '🐘 ON' : '🐘 OFF'}
                            </button>
                        </td>
                        <td style="font-size: 0.85em; color: ${p.elephantDetected ? '#f44336' : '#999'};">
                            ${p.elephantDetected ? detectedTime : '-'}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function updateWaypointTable() {
            const tbody = document.getElementById('waypoint-list');
            if (waypoints.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No waypoints</td></tr>';
                return;
            }

            tbody.innerHTML = waypoints.map(w => {
                let distDisplay = '';
                if (w.back > 0 && w.front > 0) {
                    distDisplay = `B:${w.back}m / F:${w.front}m`;
                } else if (w.back > 0) {
                    distDisplay = `Back: ${w.back}m`;
                } else if (w.front > 0) {
                    distDisplay = `Front: ${w.front}m`;
                } else {
                    distDisplay = '-';
                }
                return `
                    <tr>
                        <td>${w.id}</td>
                        <td><strong>${w.pillarId}</strong></td>
                        <td>${w.lat.toFixed(6)}</td>
                        <td>${w.lon.toFixed(6)}</td>
                        <td>${distDisplay}</td>
                        <td>${w.description}</td>
                    </tr>
                `;
            }).join('');
        }

        async function importBulk() {
            const text = document.getElementById('bulk-data').value.trim();
            if (!text) {
                showAlert('Please paste data first', 'error');
                return;
            }

            const lines = text.split('\n').filter(line => line.trim());
            const dataArray = [];
            
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(/[\t,]/).map(p => p.trim());
                if (parts.length < 4) continue;

                // Support both formats:
                // Old: index, trackPathId, lat, lon, pillerName, front, frontTotal, back, backTotal
                // New: index, trackPathId, lat, lon, pillerName, front, back
                const hasOldFormat = parts.length >= 9;
                
                const row = {
                    index: parseInt(parts[0]) || 0,
                    trackPathId: parseInt(parts[1]) || 1,
                    latitude: parseFloat(parts[2]),
                    longitude: parseFloat(parts[3]),
                    pillerName: parts[4] || '',
                    front: -1,
                    frontTotal: 0,
                    back: -1,
                    backTotal: 0
                };

                if (hasOldFormat) {
                    // Old format with Total columns
                    row.front = parts[5] ? parseInt(parts[5]) : -1;
                    row.frontTotal = parts[6] ? parseInt(parts[6]) : 0;
                    row.back = parts[7] ? parseInt(parts[7]) : -1;
                    row.backTotal = parts[8] ? parseInt(parts[8]) : 0;
                } else {
                    // New format without Total columns
                    row.front = parts[5] ? parseInt(parts[5]) : -1;
                    row.back = parts[6] ? parseInt(parts[6]) : -1;
                    row.frontTotal = 0;
                    row.backTotal = 0;
                }

                if (!isNaN(row.latitude) && !isNaN(row.longitude)) {
                    dataArray.push(row);
                }
            }

            if (dataArray.length === 0) {
                showAlert('No valid data found', 'error');
                return;
            }

            try {
                showAlert('Uploading ' + dataArray.length + ' rows...', 'info');
                
                const response = await fetch('/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: dataArray })
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    showAlert(`✅ Imported ${result.addedPillars} pillars and ${result.addedWaypoints} waypoints`, 'success');
                    document.getElementById('bulk-data').value = '';
                    await loadData();
                } else {
                    showAlert('❌ Import failed: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('❌ Connection error: ' + error.message, 'error');
            }
        }

        async function clearAll() {
            if (!confirm('⚠️ Delete ALL pillars and waypoints?')) return;

            try {
                const response = await fetch('/clear', { method: 'POST' });
                const result = await response.json();
                
                if (result.status === 'success') {
                    showAlert('✅ All data cleared', 'success');
                    await loadData();
                } else {
                    showAlert('❌ Clear failed', 'error');
                }
            } catch (error) {
                showAlert('❌ Error: ' + error.message, 'error');
            }
        }

        function showAlert(message, type) {
            const alert = document.getElementById('import-alert');
            alert.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => alert.innerHTML = '', 5000);
        }

        async function toggleElephant(pillarId) {
            const pillar = pillars.find(p => p.id === pillarId);
            if (!pillar) return;

            const newState = !pillar.elephantDetected;

            try {
                const response = await fetch('/elephant/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        pillarId: pillarId,
                        detected: newState
                    })
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    showAlert(`🐘 ${pillar.name}: Elephant detection ${newState ? 'ON' : 'OFF'}`, 'success');
                    await loadData();
                } else {
                    showAlert('❌ Error: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('❌ Connection error: ' + error.message, 'error');
            }
        }

        async function togglePillarStatus(pillarId) {
            const pillar = pillars.find(p => p.id === pillarId);
            if (!pillar) return;

            const newState = !pillar.active;

            try {
                const response = await fetch('/pillar/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        pillarId: pillarId,
                        active: newState
                    })
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    showAlert(`${pillar.name}: ${newState ? 'ENABLED' : 'DISABLED'}`, 'success');
                    await loadData();
                } else {
                    showAlert('❌ Error: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showAlert('❌ Connection error: ' + error.message, 'error');
            }
        }

        function updateSystemStatus() {
            const statusIcon = document.getElementById('system-status');
            const statusLabel = document.getElementById('system-label');
            
            if (systemEnabled) {
                statusIcon.textContent = '🟢';
                statusIcon.style.color = '#4CAF50';
                statusLabel.textContent = 'System ON';
                statusLabel.style.color = '#4CAF50';
            } else {
                statusIcon.textContent = '🔴';
                statusIcon.style.color = '#f44336';
                statusLabel.textContent = 'System OFF';
                statusLabel.style.color = '#f44336';
            }
        }

        async function toggleSystem() {
            try {
                const response = await fetch('/system/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: !systemEnabled })
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    systemEnabled = result.enabled;
                    updateSystemStatus();
                    showAlert(`System ${systemEnabled ? 'ENABLED' : 'DISABLED'}`, 'success');
                } else {
                    showAlert('❌ Error toggling system', 'error');
                }
            } catch (error) {
                showAlert('❌ Connection error: ' + error.message, 'error');
            }
        }

        // Load data on page load
        loadData();
        
        // Auto-refresh every 10 seconds
        setInterval(loadData, 10000);
    </script>
</body>
</html>
)rawliteral";

// === LittleFS Functions ===

bool initLittleFS() {
  if (!LittleFS.begin(true)) {
    return false;
  }
  return true;
}

bool savePillars() {
  File file = LittleFS.open(PILLARS_FILE, "w");
  if (!file) {
    return false;
  }
  
  DynamicJsonDocument doc(4096);
  JsonArray array = doc.to<JsonArray>();
  
  for (int i = 0; i < pillarCount; i++) {
    JsonObject obj = array.createNestedObject();
    obj["id"] = pillars[i].id;
    obj["name"] = pillars[i].name;
    obj["lat"] = pillars[i].lat;
    obj["lon"] = pillars[i].lon;
    obj["active"] = pillars[i].active;
    obj["elephantDetected"] = pillars[i].elephantDetected;
    obj["detectedAt"] = pillars[i].detectedAt;
  }
  
  serializeJson(doc, file);
  file.close();
  return true;
}

bool loadPillars() {
  if (!LittleFS.exists(PILLARS_FILE)) {
    return true;
  }
  
  File file = LittleFS.open(PILLARS_FILE, "r");
  if (!file) return false;
  
  DynamicJsonDocument doc(4096);
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
  if (error) return false;
  
  JsonArray array = doc.as<JsonArray>();
  pillarCount = 0;
  
  for (JsonObject obj : array) {
    if (pillarCount >= MAX_PILLARS) break;
    pillars[pillarCount].id = obj["id"].as<String>();
    pillars[pillarCount].name = obj["name"].as<String>();
    pillars[pillarCount].lat = obj["lat"];
    pillars[pillarCount].lon = obj["lon"];
    pillars[pillarCount].active = obj["active"] | true;
    pillars[pillarCount].elephantDetected = obj["elephantDetected"] | false;
    pillars[pillarCount].detectedAt = obj["detectedAt"] | "";
    pillarCount++;
  }
  
  return true;
}

bool saveWaypoints() {
  File file = LittleFS.open(WAYPOINTS_FILE, "w");
  if (!file) {
    return false;
  }
  
  DynamicJsonDocument doc(16384);
  JsonArray array = doc.to<JsonArray>();
  
  for (int i = 0; i < waypointCount; i++) {
    JsonObject obj = array.createNestedObject();
    obj["id"] = waypoints[i].id;
    obj["index"] = waypoints[i].index;
    obj["trackPathId"] = waypoints[i].trackPathId;
    obj["lat"] = waypoints[i].lat;
    obj["lon"] = waypoints[i].lon;
    obj["front"] = waypoints[i].front;
    obj["frontTotal"] = waypoints[i].frontTotal;
    obj["back"] = waypoints[i].back;
    obj["backTotal"] = waypoints[i].backTotal;
    obj["pillarId"] = waypoints[i].pillarId;
    obj["description"] = waypoints[i].description;
  }
  
  serializeJson(doc, file);
  file.close();
  return true;
}

bool loadWaypoints() {
  if (!LittleFS.exists(WAYPOINTS_FILE)) {
    return true;
  }
  
  File file = LittleFS.open(WAYPOINTS_FILE, "r");
  if (!file) return false;
  
  DynamicJsonDocument doc(16384);
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
  if (error) return false;
  
  JsonArray array = doc.as<JsonArray>();
  waypointCount = 0;
  
  for (JsonObject obj : array) {
    if (waypointCount >= MAX_WAYPOINTS) break;
    waypoints[waypointCount].id = obj["id"];
    waypoints[waypointCount].index = obj["index"];
    waypoints[waypointCount].trackPathId = obj["trackPathId"];
    waypoints[waypointCount].lat = obj["lat"];
    waypoints[waypointCount].lon = obj["lon"];
    waypoints[waypointCount].front = obj["front"] | 0;
    waypoints[waypointCount].frontTotal = obj["frontTotal"] | 0;
    waypoints[waypointCount].back = obj["back"] | 0;
    waypoints[waypointCount].backTotal = obj["backTotal"] | 0;
    waypoints[waypointCount].pillarId = obj["pillarId"].as<String>();
    waypoints[waypointCount].description = obj["description"].as<String>();
    waypointCount++;
  }
  
  return true;
}

// === Distance Calculation ===

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double R = 6371000; // Earth radius in meters
  double dLat = (lat2 - lat1) * PI / 180.0;
  double dLon = (lon2 - lon1) * PI / 180.0;
  
  lat1 = lat1 * PI / 180.0;
  lat2 = lat2 * PI / 180.0;
  
  double a = sin(dLat / 2) * sin(dLat / 2) +
             cos(lat1) * cos(lat2) *
             sin(dLon / 2) * sin(dLon / 2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  
  return R * c;
}

// Find nearest waypoint to train, optionally filtering by direction
// pillarId: if provided, only search waypoints for this pillar
// onlyBack: if true, only consider waypoints with back > 0 (before pillar)
// onlyFront: if true, only consider waypoints with front > 0 (after pillar)
int findNearestWaypoint(double lat, double lon, String pillarId = "", bool onlyBack = false, bool onlyFront = false) {
  if (waypointCount == 0) return -1;
  
  int nearestIndex = -1;
  double minDistance = 999999999;
  
  for (int i = 0; i < waypointCount; i++) {
    // Filter by pillarId if provided
    if (pillarId.length() > 0 && waypoints[i].pillarId != pillarId) {
      continue;
    }
    
    // Filter by direction
    if (onlyBack && waypoints[i].back == 0) {
      continue; // Skip waypoints without back values
    }
    if (onlyFront && waypoints[i].front == 0) {
      continue; // Skip waypoints without front values
    }
    
    double dist = calculateDistance(lat, lon, waypoints[i].lat, waypoints[i].lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
}

int findNearestPillar(double lat, double lon) {
  if (pillarCount == 0) return -1;
  
  int nearestIndex = 0;
  double minDistance = calculateDistance(lat, lon, pillars[0].lat, pillars[0].lon);
  
  for (int i = 1; i < pillarCount; i++) {
    if (!pillars[i].active) continue;
    
    double dist = calculateDistance(lat, lon, pillars[i].lat, pillars[i].lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
}

double calculateTrackDistance(double trainLat, double trainLon, String pillarId) {
  // Find waypoints for this pillar
  int nearestWpIdx = -1;
  double minDist = 999999999;
  
  for (int i = 0; i < waypointCount; i++) {
    if (waypoints[i].pillarId == pillarId) {
      double dist = calculateDistance(trainLat, trainLon, waypoints[i].lat, waypoints[i].lon);
      if (dist < minDist) {
        minDist = dist;
        nearestWpIdx = i;
      }
    }
  }
  
  if (nearestWpIdx < 0) {
    // No waypoints, return straight distance
    for (int i = 0; i < pillarCount; i++) {
      if (pillars[i].id == pillarId) {
        return calculateDistance(trainLat, trainLon, pillars[i].lat, pillars[i].lon);
      }
    }
    return 0;
  }
  
  // Return the appropriate distance based on which field has data
  Waypoint* wp = &waypoints[nearestWpIdx];
  if (wp->back > 0) {
    return wp->back;
  } else if (wp->front > 0) {
    return wp->front;
  }
  return 0;
}

// === API Handlers ===

void handleRoot() {
  server.send_P(200, "text/html", WEB_PAGE);
}

void handleGPS() {
  // Check if system is enabled
  if (!systemEnabled) {
    DynamicJsonDocument response(256);
    response["status"] = "disabled";
    response["message"] = "System is disabled";
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    return;
  }
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    Serial.println("❌ ERROR: Invalid JSON");
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  trainLat = doc["lat"];
  trainLon = doc["lon"];
  trainDataReceived = true;
  
  // Check if any pillar has elephant detected
  int elephantPillarIdx = -1;
  double minDistance = 999999999;
  
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].elephantDetected && pillars[i].active) {
      double dist = calculateDistance(trainLat, trainLon, pillars[i].lat, pillars[i].lon);
      if (dist < minDistance) {
        minDistance = dist;
        elephantPillarIdx = i;
      }
    }
  }
  
  DynamicJsonDocument response(2048);
  response["status"] = "success";
  
  if (elephantPillarIdx < 0) {
    // No elephant detected anywhere
    response["elephantDetected"] = false;
    response["message"] = "No elephant detected";
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    return;
  }
  
  // Elephant found! Calculate distance
  Pillar* elephantPillar = &pillars[elephantPillarIdx];
  
  // First, find the pillar waypoint (where front=0 and back=0)
  int pillarWaypointIdx = -1;
  for (int i = 0; i < waypointCount; i++) {
    if (waypoints[i].pillarId == elephantPillar->id && 
        waypoints[i].front == 0 && waypoints[i].back == 0) {
      pillarWaypointIdx = i;
      break;
    }
  }
  
  // Determine if train is approaching (before) or leaving (after) the elephant pillar
  // by finding the nearest waypoint WITHOUT filtering first
  int tempNearestIdx = -1;
  double tempMinDist = 999999999;
  for (int i = 0; i < waypointCount; i++) {
    if (waypoints[i].pillarId == elephantPillar->id) {
      double dist = calculateDistance(trainLat, trainLon, waypoints[i].lat, waypoints[i].lon);
      if (dist < tempMinDist) {
        tempMinDist = dist;
        tempNearestIdx = i;
      }
    }
  }
  
  // Determine direction based on the temporary nearest waypoint
  bool isApproaching = false; // Train is after pillar (use front values)
  bool isLeaving = false;     // Train is before pillar (use back values)
  
  if (tempNearestIdx >= 0 && pillarWaypointIdx >= 0) {
    if (waypoints[tempNearestIdx].back > 0) {
      isApproaching = true; // This waypoint has back value, so train is approaching
    } else if (waypoints[tempNearestIdx].front > 0) {
      isLeaving = true; // This waypoint has front value, so train has passed
    }
  }
  
  // Now find nearest waypoint for this elephant pillar, filtering by direction
  int nearestWaypointIdx = -1;
  double minWpDist = 999999999;
  
  for (int i = 0; i < waypointCount; i++) {
    if (waypoints[i].pillarId != elephantPillar->id) {
      continue;
    }
    
    // Filter waypoints based on direction
    if (isApproaching && waypoints[i].back == 0) {
      continue; // Train approaching: only show back waypoints
    }
    if (isLeaving && waypoints[i].front == 0) {
      continue; // Train passed: only show front waypoints
    }
    
    double dist = calculateDistance(trainLat, trainLon, waypoints[i].lat, waypoints[i].lon);
    if (dist < minWpDist) {
      minWpDist = dist;
      nearestWaypointIdx = i;
    }
  }
  
  double straightDistance = calculateDistance(trainLat, trainLon, elephantPillar->lat, elephantPillar->lon);
  double trackDistance = straightDistance; // Default to straight distance
  
  // Find nearest waypoint overall (not just for elephant pillar)
  int overallNearestWpIdx = findNearestWaypoint(trainLat, trainLon);
  double nearestPillarDistance = 0;
  String nearestPillarName = "None";
  
  if (overallNearestWpIdx >= 0) {
    // Get the pillar from the nearest waypoint
    nearestPillarName = waypoints[overallNearestWpIdx].pillarId;
    // Calculate distance to the nearest waypoint (not to the pillar location)
    nearestPillarDistance = calculateDistance(trainLat, trainLon, 
      waypoints[overallNearestWpIdx].lat, waypoints[overallNearestWpIdx].lon);
  }
  
  Serial.println("\n========================================");
  Serial.println("[TRACK DISTANCE CALCULATION]");
  Serial.print("Train GPS: ");
  Serial.print(trainLat, 8);
  Serial.print(", ");
  Serial.println(trainLon, 8);
  Serial.println();
  Serial.print("Elephant Pillar: ");
  Serial.println(elephantPillar->name);
  Serial.print("Pillar GPS: ");
  Serial.print(elephantPillar->lat, 8);
  Serial.print(", ");
  Serial.println(elephantPillar->lon, 8);
  Serial.print("Train Direction: ");
  if (isApproaching) {
    Serial.println("APPROACHING pillar (using BACK waypoints)");
  } else if (isLeaving) {
    Serial.println("PASSED pillar (using FRONT waypoints)");
  } else {
    Serial.println("AT pillar or unknown");
  }
  
  if (nearestWaypointIdx < 0) {
    Serial.println();
    Serial.print("Straight Distance: ");
    Serial.print(straightDistance, 2);
    Serial.println(" m");
    Serial.print("TRACK DISTANCE: ");
    Serial.print(straightDistance, 2);
    Serial.println(" m");
  } else {
    Waypoint* nearestWp = &waypoints[nearestWaypointIdx];
    
    Serial.println();
    Serial.println("Nearest Waypoint:");
    Serial.print("  Coordinates: ");
    Serial.print(nearestWp->lat, 8);
    Serial.print(", ");
    Serial.println(nearestWp->lon, 8);
    // Serial.print("  Description: ");
    // Serial.println(nearestWp->description);
    // Serial.print("  Front: ");
    // Serial.print(nearestWp->front);
    // Serial.print("m, Back: ");
    // Serial.print(nearestWp->back);
    // Serial.println("m");
    
    // Calculate Haversine distance from train to nearest waypoint
    double trainToWaypoint = calculateDistance(trainLat, trainLon, nearestWp->lat, nearestWp->lon);
    Serial.print("  Train to Waypoint (GPS): ");
    Serial.print(trainToWaypoint, 2);
    Serial.println(" m");
    
    // Use whichever distance value is positive (> 0)
    // New CSV structure: waypoints have EITHER front OR back populated, not both
    double waypointToPillarDistance = 0;
    
    if (nearestWp->back > 0) {
      // Train is approaching pillar - use back distance
      waypointToPillarDistance = nearestWp->back;
      Serial.print("  Using BACK distance: ");
      Serial.print(waypointToPillarDistance, 0);
      Serial.println(" m");
    } else if (nearestWp->front > 0) {
      // Train has passed pillar - use front distance
      waypointToPillarDistance = nearestWp->front;
      Serial.print("  Using FRONT distance: ");
      Serial.print(waypointToPillarDistance, 0);
      Serial.println(" m");
    } else {
      // At pillar or no distance data
      waypointToPillarDistance = 0;
      Serial.println("  At pillar (distance = 0)");
    }
    
    // Calculate total track distance: train to waypoint + waypoint to pillar
    trackDistance = trainToWaypoint + waypointToPillarDistance;
    
    Serial.println();
    Serial.print("Straight Distance: ");
    Serial.print(straightDistance, 2);
    Serial.println(" m");
    Serial.print("TRACK DISTANCE: ");
    Serial.print(trackDistance, 2);
    Serial.println(" m");
  }
  
  Serial.println("========================================\n");
  
  response["elephantDetected"] = true;
  response["elephantLocation"]["lat"] = elephantPillar->lat;
  response["elephantLocation"]["lon"] = elephantPillar->lon;
  response["elephantLocation"]["pillarId"] = elephantPillar->id;
  response["elephantLocation"]["pillarName"] = elephantPillar->name;
  response["elephantLocation"]["detectedAt"] = elephantPillar->detectedAt;
  response["distance"]["track"] = trackDistance;
  response["distance"]["track_km"] = trackDistance / 1000;
  response["distance"]["straight"] = straightDistance;
  response["distance"]["straight_km"] = straightDistance / 1000;
  response["distance"]["nearestPillar"] = nearestPillarDistance;
  response["distance"]["nearestPillar_km"] = nearestPillarDistance / 1000;
  response["distance"]["nearestPillarName"] = nearestPillarName;
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
}

void handleStatus() {
  
  DynamicJsonDocument response(1024);
  response["status"] = "online";
  response["systemEnabled"] = systemEnabled;
  response["trainConnected"] = trainDataReceived;
  response["pillarCount"] = pillarCount;
  response["waypointCount"] = waypointCount;
  
  if (trainDataReceived) {
    response["trainLat"] = trainLat;
    response["trainLon"] = trainLon;
  }
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
}

void handleGetPillars() {
  DynamicJsonDocument response(4096);
  response["status"] = "success";
  response["count"] = pillarCount;
  
  JsonArray array = response.createNestedArray("pillars");
  for (int i = 0; i < pillarCount; i++) {
    JsonObject obj = array.createNestedObject();
    obj["id"] = pillars[i].id;
    obj["name"] = pillars[i].name;
    obj["lat"] = pillars[i].lat;
    obj["lon"] = pillars[i].lon;
    obj["elephantDetected"] = pillars[i].elephantDetected;
    obj["detectedAt"] = pillars[i].detectedAt;
    obj["active"] = pillars[i].active;
  }
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
}

void handleGetWaypoints() {
  DynamicJsonDocument response(16384);
  response["status"] = "success";
  response["count"] = waypointCount;
  
  JsonArray array = response.createNestedArray("waypoints");
  for (int i = 0; i < waypointCount; i++) {
    JsonObject obj = array.createNestedObject();
    obj["id"] = waypoints[i].id;
    obj["index"] = waypoints[i].index;
    obj["trackPathId"] = waypoints[i].trackPathId;
    obj["lat"] = waypoints[i].lat;
    obj["lon"] = waypoints[i].lon;
    obj["front"] = waypoints[i].front;
    obj["frontTotal"] = waypoints[i].frontTotal;
    obj["back"] = waypoints[i].back;
    obj["backTotal"] = waypoints[i].backTotal;
    obj["pillarId"] = waypoints[i].pillarId;
    obj["description"] = waypoints[i].description;
  }
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
}

void handleClearAll() {
  pillarCount = 0;
  waypointCount = 0;
  savePillars();
  saveWaypoints();
  
  StaticJsonDocument<200> response;
  response["status"] = "success";
  response["message"] = "All data cleared from LittleFS";
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
  
}

// Add single pillar
void handleAddPillar() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  if (pillarCount >= MAX_PILLARS) {
    server.send(400, "application/json", "{\"error\":\"Maximum pillars reached\"}");
    return;
  }
  
  String name = doc["name"].as<String>();
  double lat = doc["lat"];
  double lon = doc["lon"];
  
  if (name.length() == 0) {
    server.send(400, "application/json", "{\"error\":\"Pillar name required\"}");
    return;
  }
  
  // Check for duplicate name
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].name == name) {
      server.send(400, "application/json", "{\"error\":\"Pillar name already exists\"}");
      return;
    }
  }
  
  pillars[pillarCount].id = name;
  pillars[pillarCount].name = name;
  pillars[pillarCount].lat = lat;
  pillars[pillarCount].lon = lon;
  pillars[pillarCount].active = true;
  pillars[pillarCount].elephantDetected = false;
  pillars[pillarCount].detectedAt = "";
  pillarCount++;
  
  if (savePillars()) {
    StaticJsonDocument<512> response;
    response["status"] = "success";
    response["message"] = "Pillar added successfully";
    response["pillar"]["id"] = name;
    response["pillar"]["name"] = name;
    response["pillar"]["lat"] = lat;
    response["pillar"]["lon"] = lon;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save pillar\"}");
  }
}

// Add single waypoint
void handleAddWaypoint() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  if (waypointCount >= MAX_WAYPOINTS) {
    server.send(400, "application/json", "{\"error\":\"Maximum waypoints reached\"}");
    return;
  }
  
  String pillarId = doc["pillarId"].as<String>();
  double lat = doc["lat"];
  double lon = doc["lon"];
  double distanceFromPillar = doc["distanceFromPillar"] | 0;
  String description = doc["description"] | "";
  
  if (pillarId.length() == 0) {
    server.send(400, "application/json", "{\"error\":\"Pillar ID required\"}");
    return;
  }
  
  // Verify pillar exists
  bool pillarExists = false;
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].id == pillarId) {
      pillarExists = true;
      break;
    }
  }
  
  if (!pillarExists) {
    server.send(400, "application/json", "{\"error\":\"Pillar not found\"}");
    return;
  }
  
  waypoints[waypointCount].id = waypointCount;
  waypoints[waypointCount].index = waypointCount;
  waypoints[waypointCount].trackPathId = 1;
  waypoints[waypointCount].lat = lat;
  waypoints[waypointCount].lon = lon;
  waypoints[waypointCount].front = 0;
  waypoints[waypointCount].frontTotal = 0;
  waypoints[waypointCount].back = 0;
  waypoints[waypointCount].backTotal = 0;
  waypoints[waypointCount].pillarId = pillarId;
  waypoints[waypointCount].description = description;
  waypointCount++;
  
  if (saveWaypoints()) {
    StaticJsonDocument<512> response;
    response["status"] = "success";
    response["message"] = "Waypoint added successfully";
    response["waypointCount"] = waypointCount;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save waypoint\"}");
  }
}

// Update waypoint
void handleUpdateWaypoint() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  int waypointId = doc["id"];
  
  if (waypointId < 0 || waypointId >= waypointCount) {
    server.send(400, "application/json", "{\"error\":\"Waypoint not found\"}");
    return;
  }
  
  if (doc.containsKey("front")) {
    waypoints[waypointId].front = doc["front"];
  }
  
  if (doc.containsKey("back")) {
    waypoints[waypointId].back = doc["back"];
  }
  
  if (doc.containsKey("frontTotal")) {
    waypoints[waypointId].frontTotal = doc["frontTotal"];
  }
  
  if (doc.containsKey("backTotal")) {
    waypoints[waypointId].backTotal = doc["backTotal"];
  }
  
  if (doc.containsKey("description")) {
    waypoints[waypointId].description = doc["description"].as<String>();
  }
  
  if (saveWaypoints()) {
    StaticJsonDocument<256> response;
    response["status"] = "success";
    response["message"] = "Waypoint updated successfully";
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save waypoint\"}");
  }
}

// Bulk import from spreadsheet format
void handleBulkImport() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(32768);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  JsonArray dataArray = doc["data"].as<JsonArray>();
  if (dataArray.isNull()) {
    server.send(400, "application/json", "{\"error\":\"Missing 'data' array\"}");
    return;
  }
  
  // Clear existing data
  pillarCount = 0;
  waypointCount = 0;
  
  int addedPillars = 0;
  int addedWaypoints = 0;
  
  // PASS 1: Find all pillars first and identify waypoint groups
  struct WaypointGroup {
    int startIdx;
    int endIdx;
    String pillarId;
  };
  WaypointGroup groups[50];
  int groupCount = 0;
  
  int rowCount = dataArray.size();
  
  // Find pillar positions
  for (int i = 0; i < rowCount; i++) {
    JsonObject row = dataArray[i];
    String pillerName = row["pillerName"] | "";
    
    if (pillerName.length() > 0) {
      // Found a pillar - determine which waypoints belong to it
      // Waypoints BEFORE this pillar (with "back" values) belong to this pillar
      // Waypoints AFTER this pillar (with "front" values) also belong to this pillar
      
      // Find start: look backward for waypoints with "back" values
      int startIdx = i;
      for (int j = i - 1; j >= 0; j--) {
        JsonObject prevRow = dataArray[j];
        String prevPillerName = prevRow["pillerName"] | "";
        int back = prevRow["back"] | -1;
        
        if (prevPillerName.length() > 0) {
          // Hit another pillar, stop
          break;
        }
        if (back > 0) {
          // This waypoint has "back" value, include it
          startIdx = j;
        } else {
          // No back value, might be orphaned or belong to previous pillar
          break;
        }
      }
      
      // Find end: look forward for waypoints with "front" values
      int endIdx = i;
      for (int j = i + 1; j < rowCount; j++) {
        JsonObject nextRow = dataArray[j];
        String nextPillerName = nextRow["pillerName"] | "";
        int front = nextRow["front"] | -1;
        int back = nextRow["back"] | -1;
        
        if (nextPillerName.length() > 0) {
          // Hit another pillar, stop
          break;
        }
        if (front > 0) {
          // This waypoint has "front" value, include it
          endIdx = j;
        } else if (back > 0) {
          // This waypoint has "back" value, belongs to next pillar
          break;
        }
      }
      
      if (groupCount < 50) {
        groups[groupCount].startIdx = startIdx;
        groups[groupCount].endIdx = endIdx;
        groups[groupCount].pillarId = pillerName;
        groupCount++;
      }
    }
  }
  
  // PASS 2: Create pillars and waypoints based on groups
  for (int g = 0; g < groupCount; g++) {
    String pillarId = groups[g].pillarId;
    int pillarRowIdx = -1;
    
    // Find the pillar row within this group
    for (int i = groups[g].startIdx; i <= groups[g].endIdx; i++) {
      JsonObject row = dataArray[i];
      String pillerName = row["pillerName"] | "";
      
      if (pillerName == pillarId) {
        pillarRowIdx = i;
        
        // Add pillar
        if (pillarCount < MAX_PILLARS) {
          double latitude = row["latitude"];
          double longitude = row["longitude"];
          
          pillars[pillarCount].id = pillarId;
          pillars[pillarCount].name = pillarId;
          pillars[pillarCount].lat = latitude;
          pillars[pillarCount].lon = longitude;
          pillars[pillarCount].active = true;
          pillars[pillarCount].detectedAt = "";
          pillars[pillarCount].elephantDetected = false;
          pillarCount++;
          addedPillars++;
        }
        break;
      }
    }
    
    // Add all waypoints for this pillar
    for (int i = groups[g].startIdx; i <= groups[g].endIdx; i++) {
      if (i == pillarRowIdx) continue; // Skip the pillar row itself
      
      JsonObject row = dataArray[i];
      String pillerName = row["pillerName"] | "";
      if (pillerName.length() > 0) continue; // Skip pillar rows
      
      if (waypointCount >= MAX_WAYPOINTS) continue;
      
      int index = row["index"] | 0;
      int trackPathId = row["trackPathId"] | 1;
      double latitude = row["latitude"];
      double longitude = row["longitude"];
      int front = row["front"] | 0;
      int frontTotal = row["frontTotal"] | 0;
      int back = row["back"] | 0;
      int backTotal = row["backTotal"] | 0;
      
      // Skip waypoints without any distance data
      if (front == 0 && back == 0) {
        continue;
      }
      
      // Build description
      String desc = "";
      if (back > 0 && front > 0) {
        desc = String(back) + "m before / " + String(front) + "m after " + pillarId;
      } else if (back > 0) {
        desc = String(back) + "m before " + pillarId;
      } else if (front > 0) {
        desc = String(front) + "m after " + pillarId;
      }
      
      waypoints[waypointCount].id = waypointCount;
      waypoints[waypointCount].index = index;
      waypoints[waypointCount].trackPathId = trackPathId;
      waypoints[waypointCount].lat = latitude;
      waypoints[waypointCount].lon = longitude;
      waypoints[waypointCount].front = front;
      waypoints[waypointCount].frontTotal = frontTotal;
      waypoints[waypointCount].back = back;
      waypoints[waypointCount].backTotal = backTotal;
      waypoints[waypointCount].pillarId = pillarId;
      waypoints[waypointCount].description = desc;
      
      waypointCount++;
      addedWaypoints++;
    }
  }
  
  // Save to LittleFS storage
  bool saved = savePillars() && saveWaypoints();
  
  if (saved) {
    DynamicJsonDocument response(512);
    response["status"] = "success";
    response["message"] = "Bulk import completed and saved to LittleFS";
    response["addedPillars"] = addedPillars;
    response["addedWaypoints"] = addedWaypoints;
    response["totalPillars"] = pillarCount;
    response["totalWaypoints"] = waypointCount;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save to LittleFS\"}");
  }
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void handleDeletePillar() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  String pillarId = doc["id"].as<String>();
  
  // Find and delete pillar
  int deleteIndex = -1;
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].id == pillarId) {
      deleteIndex = i;
      break;
    }
  }
  
  if (deleteIndex == -1) {
    server.send(404, "application/json", "{\"error\":\"Pillar not found\"}");
    return;
  }
  
  // Delete associated waypoints first
  int deletedWaypoints = 0;
  for (int i = waypointCount - 1; i >= 0; i--) {
    if (waypoints[i].pillarId == pillarId) {
      // Shift remaining waypoints
      for (int j = i; j < waypointCount - 1; j++) {
        waypoints[j] = waypoints[j + 1];
      }
      waypointCount--;
      deletedWaypoints++;
    }
  }
  
  // Shift remaining pillars
  for (int i = deleteIndex; i < pillarCount - 1; i++) {
    pillars[i] = pillars[i + 1];
  }
  pillarCount--;
  
  // Save to LittleFS
  bool saved = savePillars() && saveWaypoints();
  
  if (saved) {
    DynamicJsonDocument response(256);
    response["status"] = "success";
    response["message"] = "Pillar deleted";
    response["deletedWaypoints"] = deletedWaypoints;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

void handleDeleteWaypoint() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  int waypointId = doc["id"].as<int>();
  
  // Find and delete waypoint
  int deleteIndex = -1;
  for (int i = 0; i < waypointCount; i++) {
    if (waypoints[i].id == waypointId) {
      deleteIndex = i;
      break;
    }
  }
  
  if (deleteIndex == -1) {
    server.send(404, "application/json", "{\"error\":\"Waypoint not found\"}");
    return;
  }
  
  // Shift remaining waypoints
  for (int i = deleteIndex; i < waypointCount - 1; i++) {
    waypoints[i] = waypoints[i + 1];
  }
  waypointCount--;
  
  // Save to LittleFS
  bool saved = saveWaypoints();
  
  if (saved) {
    server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Waypoint deleted\"}");
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

// Toggle system enable/disable
void handleToggleSystem() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  systemEnabled = doc["enabled"];
  
  DynamicJsonDocument response(256);
  response["status"] = "success";
  response["enabled"] = systemEnabled;
  response["message"] = systemEnabled ? "System enabled" : "System disabled";
  
  String output;
  serializeJson(response, output);
  server.send(200, "application/json", output);
}

// Toggle pillar active/inactive status
void handleTogglePillarStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  String pillarId = doc["pillarId"].as<String>();
  bool active = doc["active"];
  
  // Find pillar
  int pillarIdx = -1;
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].id == pillarId) {
      pillarIdx = i;
      break;
    }
  }
  
  if (pillarIdx == -1) {
    server.send(404, "application/json", "{\"error\":\"Pillar not found\"}");
    return;
  }
  
  // Toggle pillar status
  pillars[pillarIdx].active = active;
  
  // Save to LittleFS
  bool saved = savePillars();
  
  if (saved) {
    DynamicJsonDocument response(256);
    response["status"] = "success";
    response["message"] = active ? "Pillar enabled" : "Pillar disabled";
    response["pillarId"] = pillarId;
    response["active"] = active;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

// Toggle elephant detection for a pillar
void handleToggleElephant() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  String pillarId = doc["pillarId"].as<String>();
  bool detected = doc["detected"];
  
  // Find pillar
  int pillarIdx = -1;
  for (int i = 0; i < pillarCount; i++) {
    if (pillars[i].id == pillarId) {
      pillarIdx = i;
      break;
    }
  }
  
  if (pillarIdx == -1) {
    server.send(404, "application/json", "{\"error\":\"Pillar not found\"}");
    return;
  }
  
  // Toggle elephant detection
  pillars[pillarIdx].elephantDetected = detected;
  
  // Record timestamp when elephant is detected
  if (detected) {
    // Get current time in milliseconds since boot
    unsigned long currentMillis = millis();
    unsigned long seconds = currentMillis / 1000;
    unsigned long minutes = seconds / 60;
    unsigned long hours = minutes / 60;
    
    char timestamp[20];
    sprintf(timestamp, "%02lu:%02lu:%02lu", hours % 24, minutes % 60, seconds % 60);
    pillars[pillarIdx].detectedAt = String(timestamp);
  }
  
  // Save to LittleFS
  bool saved = savePillars();
  
  if (saved) {
    DynamicJsonDocument response(512);
    response["status"] = "success";
    response["message"] = detected ? "Elephant detected" : "Elephant cleared";
    response["pillarId"] = pillarId;
    response["detected"] = detected;
    response["detectedAt"] = pillars[pillarIdx].detectedAt;
    
    String output;
    serializeJson(response, output);
    server.send(200, "application/json", output);
    
  } else {
    server.send(500, "application/json", "{\"error\":\"Failed to save\"}");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n================================");
  Serial.println("ESP32 Pillar Manager");
  Serial.println("================================");
  
  // Initialize LittleFS
  if (!initLittleFS()) {
    Serial.println("❌ LittleFS initialization failed!");
    return;
  }
  Serial.println("✓ LittleFS initialized");
  
  // Load data from LittleFS
  loadPillars();
  loadWaypoints();
  Serial.print("✓ Loaded ");
  Serial.print(pillarCount);
  Serial.print(" pillars, ");
  Serial.print(waypointCount);
  Serial.println(" waypoints");
  
  // Connect to WiFi
  Serial.println("\nConnecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    Serial.print(".");
    delay(500);
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("SSID: ");
    Serial.println(ssid);
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println("\n================================");
    Serial.println("🌐 Web Interface:");
    Serial.print("http://");
    Serial.println(WiFi.localIP());
    Serial.println("================================\n");
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ESP32-Elephant", "12345678");
    Serial.println("\n✓ AP Mode Started");
    Serial.println("SSID: ESP32-Elephant");
    Serial.println("Password: 12345678");
    Serial.print("IP Address: ");
    Serial.println(WiFi.softAPIP());
    Serial.println("\n================================");
    Serial.println("🌐 Web Interface:");
    Serial.print("http://");
    Serial.println(WiFi.softAPIP());
    Serial.println("================================\n");
  }
  
  // Setup routes
  server.on("/", HTTP_GET, handleRoot);  // Web interface
  server.on("/gps", HTTP_POST, handleGPS);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/pillars", HTTP_GET, handleGetPillars);
  server.on("/waypoints", HTTP_GET, handleGetWaypoints);
  server.on("/import", HTTP_POST, handleBulkImport);
  server.on("/clear", HTTP_POST, handleClearAll);
  server.on("/pillar/add", HTTP_POST, handleAddPillar);
  server.on("/pillar/delete", HTTP_POST, handleDeletePillar);
  server.on("/waypoint/add", HTTP_POST, handleAddWaypoint);
  server.on("/waypoint/update", HTTP_POST, handleUpdateWaypoint);
  server.on("/waypoint/delete", HTTP_POST, handleDeleteWaypoint);
  server.on("/elephant/toggle", HTTP_POST, handleToggleElephant);
  server.on("/system/toggle", HTTP_POST, handleToggleSystem);
  server.on("/pillar/toggle", HTTP_POST, handleTogglePillarStatus);
  
  // CORS handlers
  server.on("/gps", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/pillars", HTTP_OPTIONS, handleOptions);
  server.on("/waypoints", HTTP_OPTIONS, handleOptions);
  server.on("/import", HTTP_OPTIONS, handleOptions);
  server.on("/clear", HTTP_OPTIONS, handleOptions);
  server.on("/pillar/add", HTTP_OPTIONS, handleOptions);
  server.on("/pillar/delete", HTTP_OPTIONS, handleOptions);
  server.on("/waypoint/add", HTTP_OPTIONS, handleOptions);
  server.on("/waypoint/update", HTTP_OPTIONS, handleOptions);
  server.on("/waypoint/delete", HTTP_OPTIONS, handleOptions);
  server.on("/elephant/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/system/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/pillar/toggle", HTTP_OPTIONS, handleOptions);
  
  server.enableCORS(true);
  server.begin();
}

void loop() {
  server.handleClient();
}
