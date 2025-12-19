import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AlertCard from '../components/AlertCard';
import DistancePanel from '../components/DistancePanel';
import RiskIndicator from '../components/RiskIndicator';

import locationService from '../services/locationService';
import esp32Service from '../services/esp32Service';
import distanceService from '../services/distanceService';
import esp32TestService from '../services/esp32TestService';
import notificationSyncService from '../services/notificationSyncService';
import { AuthContext } from '../context/AuthContext';

export default function DashboardScreen() {
  const [esp32Data, setEsp32Data] = useState(null);
  const [distance, setDistance] = useState(null);
  const [trainLocation, setTrainLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);
  
  const { user, userProfile } = React.useContext(AuthContext);

  // Mock user name (replace with actual logged-in user)
  const userName = user?.displayName || "Sir!";

  useEffect(() => {
    initializeGPS();
    const clockInterval = startClock();
    loadUnsyncedCount();

    // Listen for ESP32 incoming data
    const unsubscribeESP32 = esp32Service.addListener(async (data) => {
      setEsp32Data(data);

      // Save notification to local storage and sync
      await saveNotification(data);

      if (data.elephantDetected && data.elephantLocation) {
        distanceService.startCalculation(data.elephantLocation);
      }

      if (data.elephantLeft) {
        distanceService.stopCalculation(true);
        setDistance(null);
      }
    });

    // Listen for distance updates
    const unsubscribeDistance = distanceService.addListener(
      (dist, trainLoc, elephantLoc) => {
        setDistance(dist);
        setTrainLocation(trainLoc);
      }
    );

    // Listen for sync status updates
    const unsubscribeSync = notificationSyncService.addSyncListener((status) => {
      setSyncStatus(status);
      if (status.status === 'complete') {
        loadUnsyncedCount();
      }
    });

    loadStoredData();

    // AUTO-RUN TEST MODE WHEN IN DEVELOPMENT
    if (__DEV__) {
      console.log("Running Test Scenario: elephant_detection");
      esp32TestService.startScenario("elephant_detection", 5000, true);

      // AVAILABLE:
      // esp32TestService.startScenario("critical_distance", 5000, true);
      // esp32TestService.startScenario("rapid_risk_changes", 5000, true);
      // esp32TestService.startRandom(8000);
    }

    return () => {
      unsubscribeESP32();
      unsubscribeDistance();
      unsubscribeSync();
      distanceService.stopCalculation();
      locationService.stopWatching();
      esp32TestService.stop();
      esp32Service.stopSimulation();
      clearInterval(clockInterval);
    };
  }, []);

  const startClock = () => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return interval;
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
    const count = await notificationSyncService.getUnsyncedCount();
    setUnsyncedCount(count);
  };

  const saveNotification = async (data) => {
    try {
      const notificationData = {
        elephantDetected: data.elephantDetected,
        elephantLeft: data.elephantLeft,
        riskLevel: data.riskLevel,
        distance: distance,
        elephantLocation: data.elephantLocation,
        trainLocation: trainLocation,
        userId: user?.uid,
        trainNumber: userProfile?.trainNumber,
        timestamp: data.timestamp,
        deviceInfo: {
          platform: Platform.OS,
        },
      };

      await notificationSyncService.saveNotification(notificationData);
      await loadUnsyncedCount();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeGPS();
    await loadStoredData();
    await loadUnsyncedCount();
    
    // Try to sync notifications if online
    if (notificationSyncService.checkOnlineStatus()) {
      await notificationSyncService.syncNotifications();
    }
    
    setRefreshing(false);
  };

  // Risk calculation
  const getRiskLevel = () => {
    if (!esp32Data) return null;

    if (esp32Data.elephantLeft) return "none";

    if (distance !== null && distance < 1) return "critical";

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

        {/* Distance Panel */}
        {esp32Data?.elephantDetected && !esp32Data.elephantLeft && (
          <DistancePanel
            distance={distance}
            trainLocation={trainLocation}
            elephantLocation={esp32Data.elephantLocation}
            gpsEnabled={gpsEnabled}
          />
        )}

        {/* Alerts */}
        <AlertCard esp32Data={esp32Data} distance={distance} />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>System Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Update:</Text>
            <Text style={styles.infoValue}>
              {esp32Data?.timestamp
                ? new Date(esp32Data.timestamp).toLocaleTimeString()
                : "No data"}
            </Text>
          </View>

          {trainLocation && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Train Location:</Text>
              <Text style={styles.infoValue}>
                {trainLocation.latitude.toFixed(6)},{" "}
                {trainLocation.longitude.toFixed(6)}
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },

  dateTime: {
    fontSize: 14,
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
    fontSize: 12,
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
});
