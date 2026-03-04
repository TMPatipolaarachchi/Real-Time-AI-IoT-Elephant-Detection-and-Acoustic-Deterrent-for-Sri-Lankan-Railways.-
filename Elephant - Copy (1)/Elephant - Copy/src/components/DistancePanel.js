import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/haversine';
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, moderateScale,
} from '../theme';

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
  const mainDistance = esp32Distances?.track_km ?? null;

  if (!gpsEnabled) {
    return (
      <View style={[styles.panel, styles.errorPanel]}>
        <Ionicons name="location-outline" size={moderateScale(28)} color={COLORS.textInverse} />
        <Text style={styles.statusTitle}>GPS Not Available</Text>
        <Text style={styles.statusSub}>Please enable GPS to calculate distance</Text>
      </View>
    );
  }

  if (!trainLocation) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color={COLORS.textInverse} />
        <Text style={styles.statusSub}>Acquiring train GPS location...</Text>
      </View>
    );
  }

  if (!elephantLocation) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color={COLORS.textInverse} />
        <Text style={styles.statusSub}>Waiting for elephant location...</Text>
      </View>
    );
  }

  if (mainDistance === null || mainDistance === undefined) {
    return (
      <View style={[styles.panel, styles.loadingPanel]}>
        <ActivityIndicator size="large" color={COLORS.textInverse} />
        <Text style={styles.statusSub}>ESP32 calculating distance...</Text>
      </View>
    );
  }

  const isCritical = mainDistance < 1;
  const isClose = mainDistance < 2;

  const panelBg = isCritical
    ? COLORS.danger
    : isClose
    ? COLORS.warning
    : COLORS.primary;

  return (
    <View style={[styles.panel, { backgroundColor: panelBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="swap-horizontal" size={moderateScale(18)} color="rgba(255,255,255,0.8)" />
        <Text style={styles.title}>Train–Elephant Distance</Text>
      </View>

      {/* Main Distance */}
      <View style={styles.distanceCenter}>
        <Text style={[styles.distanceValue, isCritical && styles.distanceCritical]}>
          {formatDistance(mainDistance)}
        </Text>
        <Text style={styles.distanceLabel}>Track Distance (ESP32)</Text>
        {isCritical && (
          <View style={styles.emergencyBadge}>
            <Ionicons name="warning" size={moderateScale(14)} color={COLORS.danger} />
            <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
          </View>
        )}
      </View>

      {/* Critical Warning */}
      {isCritical && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>CRITICAL: Distance less than 1 km</Text>
          <Text style={styles.warningSub}>Emergency braking recommended!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    ...SHADOWS.lg,
  },
  loadingPanel: {
    backgroundColor: COLORS.textTertiary,
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  errorPanel: {
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  statusTitle: {
    color: COLORS.textInverse,
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  statusSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(13),
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  distanceCenter: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  distanceValue: {
    fontSize: moderateScale(48),
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 1,
  },
  distanceCritical: {
    fontSize: moderateScale(52),
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  distanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: moderateScale(12),
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.textInverse,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  emergencyBadgeText: {
    color: COLORS.danger,
    fontSize: moderateScale(13),
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  warningBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  warningTitle: {
    color: COLORS.textInverse,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  warningSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(13),
    marginTop: SPACING.xs,
  },
});