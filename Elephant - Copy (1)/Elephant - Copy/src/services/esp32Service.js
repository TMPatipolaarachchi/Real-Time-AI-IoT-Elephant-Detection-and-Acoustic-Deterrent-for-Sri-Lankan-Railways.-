import AsyncStorage from '@react-native-async-storage/async-storage';

const ESP32_DATA_KEY = 'esp32_data';
const ESP32_ALERTS_KEY = 'esp32_alerts';

class ESP32Service {
  constructor() {
    this.listeners = [];
  }

  /**
   * Add a listener for ESP32 data updates
   * @param {function} callback - Callback function to receive updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of new data
   * @param {object} data - ESP32 data
   */
  notifyListeners(data) {
    this.listeners.forEach((listener) => listener(data));
  }

  /**
   * Store ESP32 data locally (offline-first)
   * @param {object} data - ESP32 data
   */
  async storeData(data) {
    try {
      await AsyncStorage.setItem(ESP32_DATA_KEY, JSON.stringify(data));
      await this.addAlert(data);
    } catch (error) {
    }
  }

  /**
   * Get stored ESP32 data
   */
  async getStoredData() {
    try {
      const data = await AsyncStorage.getItem(ESP32_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Add alert to history
   */
  async addAlert(data) {
    try {
      const alerts = await this.getAlerts();
      alerts.unshift({
        ...data,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 alerts
      const limitedAlerts = alerts.slice(0, 50);
      await AsyncStorage.setItem(ESP32_ALERTS_KEY, JSON.stringify(limitedAlerts));
    } catch (error) {
    }
  }

  /**
   * Get alert history
   */
  async getAlerts() {
    try {
      const alerts = await AsyncStorage.getItem(ESP32_ALERTS_KEY);
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Process incoming ESP32 data
   * Expected format:
   * {
   *   elephantDetected: boolean,
   *   elephantLocation: { latitude: number, longitude: number },
   *   riskLevel: 'low' | 'medium' | 'high',
   *   elephantLeft: boolean
   * }
   */
  processData(data) {
    this.storeData(data);
    this.notifyListeners(data);
  }

  /**
   * Send GPS coordinates to ESP32 and get pillar distances
   * @param {string} esp32Ip - ESP32 IP address
   * @param {number} latitude - Train latitude
   * @param {number} longitude - Train longitude
   * @returns {Promise<object>} Response with nearest pillar and distances
   */
  async sendGPS(esp32Ip, latitude, longitude) {
    try {
      const response = await fetch(`http://${esp32Ip}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat: latitude, lon: longitude }),
        timeout: 5000,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Silently handle "no pillars" error - it's expected
        if (errorText.includes('No pillars found')) {
          throw new Error(`No pillars found`);
        }
        
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Don't log "no pillars" error - it's expected
      if (!error.message.includes('No pillars found')) {
      }
      throw error;
    }
  }

  

  /**
   * Get ESP32 status
   * @param {string} esp32Ip - ESP32 IP address
   * @returns {Promise<object>} Status information
   */
  async getStatus(esp32Ip) {
    try {
      const response = await fetch(`http://${esp32Ip}/status`, { timeout: 5000 });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all pillars from ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @returns {Promise<object>} Pillars data
   */
  async getPillars(esp32Ip) {
    try {
      const response = await fetch(`http://${esp32Ip}/pillars`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all waypoints from ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @returns {Promise<object>} Waypoints data
   */
  async getWaypoints(esp32Ip) {
    try {
      const response = await fetch(`http://${esp32Ip}/waypoints`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk import pillars and waypoints to ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @param {array} data - Array of data rows with pillars and waypoints
   * @returns {Promise<object>} Import result
   */
  async bulkImport(esp32Ip, data) {
    try {
      const response = await fetch(`http://${esp32Ip}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear all data from ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @returns {Promise<object>} Clear result
   */
  async clearAll(esp32Ip) {
    try {
      const response = await fetch(`http://${esp32Ip}/clear`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a single pillar to ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @param {string} name - Pillar name
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<object>} Add result
   */
  async addPillar(esp32Ip, name, lat, lon) {
    try {
      const response = await fetch(`http://${esp32Ip}/pillar/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, lat, lon }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a single waypoint to ESP32
   * @param {string} esp32Ip - ESP32 IP address
   * @param {string} pillarId - Pillar ID
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} distanceFromPillar - Distance from pillar in meters
   * @param {string} description - Description
   * @returns {Promise<object>} Add result
   */
  async addWaypoint(esp32Ip, pillarId, lat, lon, distanceFromPillar, description = '') {
    try {
      const response = await fetch(`http://${esp32Ip}/waypoint/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pillarId, lat, lon, distanceFromPillar, description }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a waypoint
   * @param {string} esp32Ip - ESP32 IP address
   * @param {number} waypointId - Waypoint ID
   * @param {object} updates - Updates object {distanceFromPillar, description}
   * @returns {Promise<object>} Update result
   */
  async updateWaypoint(esp32Ip, waypointId, updates) {
    try {
      const response = await fetch(`http://${esp32Ip}/waypoint/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: waypointId, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a pillar
   * @param {string} esp32Ip - ESP32 IP address
   * @param {string} pillarId - Pillar ID
   * @returns {Promise<object>} Delete result
   */
  async deletePillar(esp32Ip, pillarId) {
    try {
      const response = await fetch(`http://${esp32Ip}/pillar/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: pillarId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a waypoint
   * @param {string} esp32Ip - ESP32 IP address
   * @param {number} waypointId - Waypoint ID
   * @returns {Promise<object>} Delete result
   */
  async deleteWaypoint(esp32Ip, waypointId) {
    try {
      const response = await fetch(`http://${esp32Ip}/waypoint/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: waypointId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export default new ESP32Service();

 