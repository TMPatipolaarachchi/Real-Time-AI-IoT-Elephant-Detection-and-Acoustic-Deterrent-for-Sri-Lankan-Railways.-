import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlertCard from '../components/AlertCard';
import DistancePanel from '../components/DistancePanel';
import RiskIndicator from '../components/RiskIndicator';

import locationService from '../services/locationService';
import esp32Service from '../services/esp32Service';
import distanceService from '../services/distanceService';
import pillarService from '../services/PillarService ';
import calibrationService from '../services/CalibrationService ';
import authService from '../services/authService';
import notificationStorageService from '../services/notificationStorageService';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const [esp32Data, setEsp32Data] = useState(null);
  const [distance, setDistance] = useState(null);
  const [trainLocation, setTrainLocation] = useState(null);
  const [nearestPillar, setNearestPillar] = useState(null);
  const [trackDistance, setTrackDistance] = useState(null);
  const [straightDistance, setStraightDistance] = useState(null);
  const [allPillars, setAllPillars] = useState([]);
  const [isCalibrationActive, setIsCalibrationActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);
  const [esp32Status, setEsp32Status] = useState(null);
  const [pillarCount, setPillarCount] = useState(0);
  const [waypointCount, setWaypointCount] = useState(0);
  const [esp32Distances, setEsp32Distances] = useState(null);
  const [elephantPillarName, setElephantPillarName] = useState(null);
  const [esp32Loading, setEsp32Loading] = useState(true);
  
  const { user, userProfile } = React.useContext(AuthContext);

  // Mock user name (replace with actual logged-in user)
  const userName = user?.displayName || "Sir!";

  useEffect(() => {
    initializeGPS();
    const clockInterval = startClock();
    loadUnsyncedCount();

    // Listen for calibration status changes
    const calibrationListener = (data) => {
      const isActive = calibrationService.isCalibrationActive();
      setIsCalibrationActive(isActive);
    };

    calibrationService.addListener(calibrationListener);

    // Check initial calibration state
    setIsCalibrationActive(calibrationService.isCalibrationActive());

    // Start sending GPS to ESP32 immediately (background polling)
    startGPSPolling();

    // Listen for ESP32 incoming data
    const unsubscribeESP32 = esp32Service.addListener(async (data) => {
      setEsp32Data(data);
      setEsp32Loading(false); // ESP32 has responded

      // Store ESP32 distance calculations
      if (data.distance) {
        setEsp32Distances(data.distance);
      }

      // Store elephant pillar name
      if (data.elephantLocation && data.elephantLocation.pillarName) {
        setElephantPillarName(data.elephantLocation.pillarName);
      }

      // Save notification to local storage and sync
      await saveNotification(data);

      if (data.elephantDetected && data.elephantLocation) {
        distanceService.startCalculation(data.elephantLocation);
      }

      if (data.elephantLeft) {
        // Clear UI data but don't stop communication with ESP32
        setDistance(null);
        setEsp32Distances(null);
        setElephantPillarName(null);
      }
    });

    // Listen for distance updates
    const unsubscribeDistance = distanceService.addListener(
      (dist, trainLoc, elephantLoc, nearest, trackDist, straightDist, pillars) => {
        setDistance(dist);
        setTrainLocation(trainLoc);
        setNearestPillar(nearest);
        setTrackDistance(trackDist);
        setStraightDistance(straightDist);
        setAllPillars(pillars || []);
      }
    );

    loadStoredData();

    return () => {
      unsubscribeESP32();
      unsubscribeDistance();
      calibrationService.removeListener(calibrationListener);
      distanceService.stopCalculation();
      locationService.stopWatching();
      clearInterval(clockInterval);
    };
  }, []);

  // Load ESP32 status periodically
  useEffect(() => {
    loadESP32Status();
    const statusInterval = setInterval(loadESP32Status, 30000); // Every 30 seconds
    return () => clearInterval(statusInterval);
  }, []);

  const startClock = () => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return interval;
  };

  const startGPSPolling = async () => {
    // CRITICAL: Send GPS to ESP32 every 5 seconds continuously
    // ONLY stop during calibration, continue in all other cases
    
    // Start watching location and sending every 5 seconds
    locationService.watchLocation(async (location) => {
      // ONLY check calibration status - don't stop for any other reason
      if (calibrationService.isCalibrationActive()) {
        return; // Skip GPS sending during calibration only
      }

      if (location) {
        setTrainLocation(location);
        
        try {
          // Send GPS to ESP32 and get response
          const response = await pillarService.calculateDistances(
            location.latitude,
            location.longitude
          );
          
          // Process ESP32 response - both elephant detected and not detected cases
          if (response && response.status === 'success') {
            const esp32Data = {
              elephantDetected: response.elephantDetected,
              elephantLocation: response.elephantLocation,
              distance: response.distance,
              status: response.status,
              timestamp: new Date().toISOString()
            };
            
            // CRITICAL: If no elephant detected, set elephantLeft flag to clear alarm
            if (response.elephantDetected === false) {
              esp32Data.elephantLeft = true;
            }
            
            // Notify ESP32 service listeners
            esp32Service.processData(esp32Data);
          }
        } catch (error) {
          // Continue polling even if there's an error
        }
      }
    }, 5000); // Every 5 seconds - ALWAYS (except during calibration)
  };

  const initializeGPS = async () => {
    const allowed = await locationService.requestPermissions();
    setGpsEnabled(allowed);

    if (!allowed) {
      Alert.alert(
        "GPS Required",
        "GPS access is required to calculate train-elephant distances.",
        [{ text: "OK" }]
      );
    }
  };

  const loadStoredData = async () => {
    const stored = await esp32Service.getStoredData();
    if (stored) {
      setEsp32Data(stored);

      if (stored.elephantDetected && stored.elephantLocation) {
        distanceService.startCalculation(stored.elephantLocation);
      }
    }
  };

  const loadUnsyncedCount = async () => {
    setUnsyncedCount(0);
  };

  const loadESP32Status = async () => {
    try {
      const status = await esp32Service.checkStatus();
      setEsp32Status(status);
      if (status && status.pillarCount !== undefined) {
        setPillarCount(status.pillarCount);
        setWaypointCount(status.waypointCount || 0);
      }
    } catch (error) {
    }
  };

  const saveNotification = async (data) => {
    try {
      // Only save if elephant is detected and not already left
      if (data.elephantDetected && !data.elephantLeft && data.elephantLocation) {
        // Get the most current train number - refresh profile to ensure latest data
        let trainNumber = userProfile?.trainNumber || '';
        
        // If train number is empty, try to fetch it fresh from auth service
        if (!trainNumber && user?.uid) {
          try {
            const freshProfile = await authService.getUserProfile(user.uid);
            trainNumber = freshProfile?.trainNumber || '';
          } catch (err) {
            console.error('Error fetching fresh profile:', err);
          }
        }
        
        const notificationData = {
          elephantDetected: data.elephantDetected,
          elephantLeft: data.elephantLeft,
          riskLevel: data.riskLevel,
          distance: distance,
          elephantLocation: data.elephantLocation,
          trainLocation: trainLocation,
          userId: user?.uid,
          trainNumber: trainNumber, // Use refreshed train number
          timestamp: data.timestamp,
          deviceInfo: {
            platform: Platform.OS,
          },
        };

        // Get pillar identifier
        const pillarIdentifier = data.elephantLocation?.pillarId || data.elephantLocation?.pillarName;
        
        if (pillarIdentifier) {
          // Check if this pillar with current train already has a notification
          const hasNotification = await notificationStorageService.hasNotificationFromPillar(
            pillarIdentifier,
            trainNumber
          );

          if (!hasNotification) {
            // Save first notification from this pillar with current train
            await notificationStorageService.saveFirstNotification(notificationData);
          }
        }
      }

      await loadUnsyncedCount();
    } catch (error) {
      console.error('Error in saveNotification:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeGPS();
    await loadStoredData();
    await loadUnsyncedCount();
    await loadESP32Status();
    
    // Load pillars
    try {
      await pillarService.fetchPillars();
    } catch (error) {
    }
    
    setRefreshing(false);
  };

  // Risk calculation - use ESP32 track distance
  const getRiskLevel = () => {
    if (!esp32Data) return null;

    if (esp32Data.elephantLeft) return "none";

    // Use ESP32 track distance for risk calculation
    const trackDistanceKm = esp32Distances?.track_km;
    
    if (trackDistanceKm !== null && trackDistanceKm !== undefined) {
      if (trackDistanceKm < 1) return "critical";
      if (trackDistanceKm < 2) return "high";
      if (trackDistanceKm < 7) return "medium";
      return "low";
    }

    return esp32Data.riskLevel || "low";
  };

  const riskLevel = getRiskLevel();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calibration Banner */}
        {isCalibrationActive && (
          <View style={styles.calibrationBanner}>
            <Text style={styles.calibrationText}>🔧 Calibration in Progress</Text>
            <Text style={styles.calibrationSubtext}>Other processes temporarily paused</Text>
          </View>
        )}

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.userName}>Hello, {userName}</Text>
            <Text style={styles.dateTime}>
              {currentTime.toLocaleDateString()} | {currentTime.toLocaleTimeString()}
            </Text>
          </View>

          <View
            style={[
              styles.statusIndicator,
              gpsEnabled ? styles.statusActive : null,
            ]}
          >
            <Text style={styles.statusText}>
              GPS {gpsEnabled ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Risk Box */}
        {riskLevel && <RiskIndicator riskLevel={riskLevel} />}

        {/* ESP32 Loading Message */}
        {esp32Loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>⏳ Connecting to ESP32...</Text>
            <Text style={styles.loadingSubtext}>Waiting for response</Text>
          </View>
        )}

        {/* Distance Panel */}
        {!esp32Loading && esp32Data?.elephantDetected && !esp32Data.elephantLeft && (
          <DistancePanel
            distance={distance}
            trainLocation={trainLocation}
            elephantLocation={esp32Data.elephantLocation}
            gpsEnabled={gpsEnabled}
            nearestPillar={nearestPillar}
            trackDistance={trackDistance}
            straightDistance={straightDistance}
            esp32Distances={esp32Distances}
            elephantPillarName={elephantPillarName}
          />
        )}

        {/* Alerts */}
        {!esp32Loading && (
          <AlertCard esp32Data={esp32Data} distance={distance} elephantPillarName={elephantPillarName} />
        )}

        {/* System Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>System Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Update:</Text>
            <Text style={styles.infoValue}>
              {currentTime.toLocaleTimeString()}
            </Text>
          </View>

          {trainLocation && trainLocation.latitude != null && trainLocation.longitude != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Train Location:</Text>
              <Text style={styles.infoValue}>
                {Number(trainLocation.latitude).toFixed(6)},{" "}
                {Number(trainLocation.longitude).toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },

  dateTime: {
    fontSize: 16,
    color: "#757575",
  },

  statusIndicator: {
    backgroundColor: "#F44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusActive: {
    backgroundColor: "#4CAF50",
  },

  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#212121",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 14,
    color: "#757575",
  },

  infoValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },

  // Calibration Banner Styles
  calibrationBanner: {
    backgroundColor: "#FF9800",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  calibrationText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  calibrationSubtext: {
    color: "white",
    fontSize: 12,
    opacity: 0.9,
  },

  // ESP32 Status Section
  esp32Section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },

  esp32Card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
  },

  esp32Row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  esp32Item: {
    alignItems: "center",
    flex: 1,
  },

  esp32Value: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },

  esp32Label: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },

  esp32Divider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusOnline: {
    backgroundColor: "#4CAF50",
  },

  statusOffline: {
    backgroundColor: "#9E9E9E",
  },

  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  trainLocationBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },

  trainLocationLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },

  trainLocationValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Loading Container Styles
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },

  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 8,
  },

  loadingSubtext: {
    fontSize: 14,
    color: "#757575",
    fontStyle: "italic",
  },
});