import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { formatDistance } from '../utils/haversine';

export default function DistancePanel({
  distance,
  trainLocation,
  elephantLocation,
  gpsEnabled,
}) {
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    if (distance !== null) {
      setIsCalculating(false);
    } else if (trainLocation && elephantLocation) {
      setIsCalculating(false);
    }
  }, [distance, trainLocation, elephantLocation]);

  if (!gpsEnabled) {
    return (
      <View style={[styles.panel, styles.errorPanel]}>
        <Text style={styles.errorText}>⚠️ GPS Not Available</Text>
        <Text style={styles.errorSubtext}>
          Please enable GPS to calculate distance
        </Text>
      </View>
    );
  }

  if (!trainLocation || !elephantLocation) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Acquiring GPS location...</Text>
      </View>
    );
  }

  if (distance === null) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Calculating distance...</Text>
      </View>
    );
  }

  const isCritical = distance < 1;
  const isClose = distance < 2;

  return (
    <View
      style={[
        styles.panel,
        isCritical && styles.criticalPanel,
        isClose && !isCritical && styles.warningPanel,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Train-Elephant Distance</Text>
        {isCalculating && (
          <ActivityIndicator size="small" color="#ffffff" />
        )}
      </View>

      <View style={styles.distanceContainer}>
        <Text style={[styles.distance, isCritical && styles.criticalDistance]}>
          {formatDistance(distance)}
        </Text>
        {isCritical && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>EMERGENCY</Text>
          </View>
        )}
      </View>

      {isCritical && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ CRITICAL: Distance less than 1 km
          </Text>
          <Text style={styles.warningSubtext}>
            Emergency braking recommended!
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>
            {distance <= 0.0001 ? 'Reached (0 m)' : 'Calculating'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Update Rate:</Text>
          <Text style={styles.infoValue}>Every 5 seconds</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  warningPanel: {
    backgroundColor: '#FF9800',
  },
  criticalPanel: {
    backgroundColor: '#F44336',
  },
  loadingPanel: {
    backgroundColor: '#757575',
    alignItems: 'center',
    paddingVertical: 30,
  },
  errorPanel: {
    backgroundColor: '#FF5722',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  distanceContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  distance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  criticalDistance: {
    fontSize: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  criticalBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  criticalText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  warningSubtext: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
});

