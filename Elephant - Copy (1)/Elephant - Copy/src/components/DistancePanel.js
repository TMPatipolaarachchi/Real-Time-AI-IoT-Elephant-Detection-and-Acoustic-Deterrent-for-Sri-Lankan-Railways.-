import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { formatDistance } from '../utils/haversine';

export default function DistancePanel({
  distance,
  trainLocation,
  elephantLocation,
  gpsEnabled,
  nearestPillar,
  trackDistance,
  straightDistance,
  esp32Distances,
  elephantPillarName,
}) {
  // Use ESP32's track distance as the main distance
  const mainDistance = esp32Distances?.track_km ?? null;
  
  if (!gpsEnabled) {
    return (
      <View style={[styles.panel, styles.errorPanel]}>
        <Text style={styles.errorText}>⚠ GPS Not Available</Text>
        <Text style={styles.errorSubtext}>
          Please enable GPS to calculate distance
        </Text>
      </View>
    );
  }

  if (!trainLocation) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Acquiring train GPS location...</Text>
      </View>
    );
  }

  if (!elephantLocation) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Waiting for elephant location...</Text>
      </View>
    );
  }

  if (mainDistance === null || mainDistance === undefined) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>ESP32 calculating distance...</Text>
      </View>
    );
  }

  // Use only ESP32 distances - no app calculation
  const isCritical = mainDistance < 1;
  const isClose = mainDistance < 2;
  
  const displayTrackDistance = esp32Distances?.track_km || null;
  const displayStraightDistance = esp32Distances?.straight_km || null;
  const displayNearestPillarDistance = esp32Distances?.nearestPillar_km || null;
  const displayNearestPillarName = esp32Distances?.nearestPillarName || null;

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
      </View>

      <View style={styles.distanceContainer}>
        <Text style={[styles.distance, isCritical && styles.criticalDistance]}>
          {formatDistance(mainDistance)}
        </Text>
        <Text style={styles.distanceSource}>Track Distance (ESP32)</Text>
        {isCritical && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalText}>EMERGENCY</Text>
          </View>
        )}
      </View>

      {isCritical && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠ CRITICAL: Distance less than 1 km
          </Text>
          <Text style={styles.warningSubtext}>
            Emergency braking recommended!
          </Text>
        </View>
      )}
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
    marginBottom: 4,
  },
  distanceSource: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 8,
    fontStyle: 'italic',
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
  pillarInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  pillarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pillarDistances: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pillarDistanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarDistanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillarDistanceLabel: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 4,
  },
  pillarDistanceValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Elephant Pillar Box
  elephantPillarBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  elephantPillarTitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  elephantPillarName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  // ESP32 Distance Box
  esp32DistanceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  esp32Title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  distanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  distanceGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceGridDivider: {
    width: 1,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  distanceGridLabel: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 8,
    textAlign: 'center',
  },
  distanceGridValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distanceGridSubtext: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  
  // Nearest Pillar Box
  nearestPillarBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  nearestPillarTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  nearestPillarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearestPillarInfo: {
    flex: 1,
  },
  nearestPillarName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  nearestPillarLabel: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.7,
  },
  nearestPillarDistanceBox: {
    alignItems: 'flex-end',
  },
  nearestPillarDistance: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
  },
});