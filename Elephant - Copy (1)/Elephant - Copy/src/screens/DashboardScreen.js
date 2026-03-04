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
import { Ionicons } from '@expo/vector-icons';

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
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, COMMON, moderateScale, SCREEN,
} from '../theme';

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Calibration Banner */}
        {isCalibrationActive && (
          <View style={styles.calibrationBanner}>
            <Ionicons name="construct" size={moderateScale(18)} color={COLORS.textInverse} />
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.calibrationText}>Calibration in Progress</Text>
              <Text style={styles.calibrationSubtext}>Other processes temporarily paused</Text>
            </View>
          </View>
        )}

        {/* Header Card */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.dateTime}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.gpsBadge, gpsEnabled && styles.gpsBadgeActive]}>
            <Ionicons
              name={gpsEnabled ? "location" : "location-outline"}
              size={moderateScale(14)}
              color={gpsEnabled ? COLORS.textInverse : COLORS.textTertiary}
            />
            <Text style={[styles.gpsText, gpsEnabled && styles.gpsTextActive]}>
              {gpsEnabled ? "GPS Active" : "GPS Off"}
            </Text>
          </View>
        </View>

        {/* Risk Indicator */}
        {riskLevel && <RiskIndicator riskLevel={riskLevel} />}

        {/* ESP32 Loading */}
        {esp32Loading && (
          <View style={styles.loadingCard}>
            <Ionicons name="radio-outline" size={moderateScale(24)} color={COLORS.info} />
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={styles.loadingTitle}>Connecting to ESP32...</Text>
              <Text style={styles.loadingSubtext}>Waiting for response</Text>
            </View>
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

        {/* Alert Card */}
        {!esp32Loading && (
          <AlertCard esp32Data={esp32Data} distance={distance} elephantPillarName={elephantPillarName} />
        )}

        {/* System Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.infoTitle}>System Information</Text>
          </View>
          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Update</Text>
            <Text style={styles.infoValue}>{currentTime.toLocaleTimeString()}</Text>
          </View>

          {trainLocation && trainLocation.latitude != null && trainLocation.longitude != null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Train Location</Text>
              <Text style={styles.infoValueMono}>
                {Number(trainLocation.latitude).toFixed(6)}, {Number(trainLocation.longitude).toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  contentContainer: { padding: SPACING.base, paddingBottom: SPACING['2xl'] },

  // Calibration Banner
  calibrationBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.accent, padding: SPACING.base,
    borderRadius: RADIUS.lg, marginBottom: SPACING.base,
    ...SHADOWS.colored(COLORS.accent),
  },
  calibrationText: { color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: '700' },
  calibrationSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: moderateScale(11), marginTop: 2 },

  // Header
  header: {
    ...COMMON.card, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.base,
  },
  headerLeft: { flex: 1 },
  greeting: { ...FONTS.body, color: COLORS.textTertiary },
  userName: { fontSize: moderateScale(22), fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },
  dateTime: { ...FONTS.caption, marginTop: SPACING.xs },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.background, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  gpsBadgeActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  gpsText: { fontSize: moderateScale(12), fontWeight: '600', color: COLORS.textTertiary },
  gpsTextActive: { color: COLORS.textInverse },

  // Loading Card
  loadingCard: {
    ...COMMON.card, flexDirection: 'row', alignItems: 'center',
    marginBottom: SPACING.base, borderWidth: 1.5, borderColor: COLORS.infoLight,
  },
  loadingTitle: { fontSize: moderateScale(15), fontWeight: '600', color: COLORS.info },
  loadingSubtext: { ...FONTS.caption, fontStyle: 'italic', marginTop: 2 },

  // Info Card
  infoCard: {
    ...COMMON.card, marginTop: SPACING.sm,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  infoTitle: { ...FONTS.h4, color: COLORS.primary },
  infoDivider: { height: 1, backgroundColor: COLORS.divider, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  infoLabel: { ...FONTS.body, color: COLORS.textTertiary },
  infoValue: { ...FONTS.bodyBold, color: COLORS.text },
  infoValueMono: { ...FONTS.mono, fontSize: moderateScale(12) },
});