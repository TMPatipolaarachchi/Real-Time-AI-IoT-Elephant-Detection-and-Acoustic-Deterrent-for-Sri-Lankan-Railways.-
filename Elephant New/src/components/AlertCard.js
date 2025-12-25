import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistance } from '../utils/haversine';

export default function AlertCard({ esp32Data, distance, elephantPillarName }) {
  if (!esp32Data) {
    return (
      <View style={[styles.card, styles.noDataCard]}>
        <Text style={styles.noDataText}>No detection data available</Text>
        <Text style={styles.noDataSubtext}>
          Waiting for ESP32 connection...
        </Text>
      </View>
    );
  }

  if (esp32Data.elephantLeft) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>All Clear</Text>
          <Text style={styles.message}>
            The elephant has left the area. No risk detected.
          </Text>
        </View>
      </View>
    );
  }

  if (!esp32Data.elephantDetected) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👁️</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Monitoring Active</Text>
          <Text style={styles.message}>
            System is actively monitoring for elephant presence.
          </Text>
        </View>
      </View>
    );
  }

  // Elephant detected
  const riskLevel = esp32Data.riskLevel || 'low';
  const isCritical = distance !== null && distance < 1;
  
  return (
    <View style={[styles.card, styles.alertCard, isCritical && styles.criticalCard]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🐘</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Elephant Detected!</Text>
        <Text style={styles.message}>
          An elephant has been detected in the area. Please proceed with caution.
        </Text>
        
        {/* Elephant Pillar Location */}
        {elephantPillarName && (
          <View style={styles.pillarLocationBox}>
            <Text style={styles.pillarLocationLabel}>📍 Detected At:</Text>
            <Text style={styles.pillarLocationValue}>{elephantPillarName}</Text>
          </View>
        )}
        
        {distance !== null && (
          <View style={styles.distanceInfo}>
            <Text style={styles.distanceLabel}>Current Distance:</Text>
            <Text style={[styles.distanceValue, isCritical && styles.criticalDistanceValue]}>
              {formatDistance(distance)}
            </Text>
            {isCritical && (
              <Text style={styles.criticalWarning}>
                ⚠️ CRITICAL: Less than 1 km - Emergency braking recommended!
              </Text>
            )}
          </View>
        )}
        {esp32Data.elephantLocation && esp32Data.elephantLocation.latitude != null && esp32Data.elephantLocation.longitude != null && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Detection Location:</Text>
            <Text style={styles.locationValue}>
              {Number(esp32Data.elephantLocation.latitude).toFixed(6)},{' '}
              {Number(esp32Data.elephantLocation.longitude).toFixed(6)}
            </Text>
          </View>
        )}
        {(esp32Data.elephantLocation?.detectedAt || esp32Data.timestamp) && (
          <View style={styles.timestampInfo}>
            <Text style={styles.timestampLabel}>Detection Time:</Text>
            <Text style={styles.timestampValue}>
              {esp32Data.elephantLocation?.detectedAt || new Date(esp32Data.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  safeCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  noDataCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF9800',
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 12,
  },
  distanceInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  locationInfo: {
    marginTop: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 12,
    color: '#424242',
    fontFamily: 'monospace',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 4,
  },
  criticalCard: {
    borderLeftColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  riskInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 12,
    color: '#757575',
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskLow: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  riskMedium: {
    color: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  riskHigh: {
    color: '#FF5722',
    backgroundColor: '#FFF3E0',
  },
  criticalDistanceValue: {
    color: '#F44336',
    fontSize: 20,
  },
  criticalWarning: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'bold',
    marginTop: 8,
  },
  timestampInfo: {
    marginTop: 8,
  },
  timestampLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  timestampValue: {
    fontSize: 12,
    color: '#424242',
  },  pillarLocationBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  pillarLocationLabel: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  pillarLocationValue: {
    fontSize: 18,
    color: '#0D47A1',
    fontWeight: 'bold',
  },});

