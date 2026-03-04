import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/haversine';
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, moderateScale,
} from '../theme';

export default function AlertCard({ esp32Data, distance, elephantPillarName }) {
  if (!esp32Data) {
    return (
      <View style={[styles.card, styles.noDataCard]}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.accent }]}>
          <Ionicons name="radio-outline" size={moderateScale(24)} color={COLORS.textInverse} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>No Detection Data</Text>
          <Text style={styles.cardMessage}>Waiting for ESP32 connection...</Text>
        </View>
      </View>
    );
  }

  if (esp32Data.elephantLeft) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.success }]}>
          <Ionicons name="checkmark-circle" size={moderateScale(24)} color={COLORS.textInverse} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: COLORS.success }]}>All Clear</Text>
          <Text style={styles.cardMessage}>The elephant has left the area. No risk detected.</Text>
        </View>
      </View>
    );
  }

  if (!esp32Data.elephantDetected) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
          <Ionicons name="eye" size={moderateScale(24)} color={COLORS.textInverse} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: COLORS.primary }]}>Monitoring Active</Text>
          <Text style={styles.cardMessage}>System is actively monitoring for elephant presence.</Text>
        </View>
      </View>
    );
  }

  // Elephant detected
  const displayDistance = (esp32Data && esp32Data.distance !== undefined) ? esp32Data.distance : (distance !== undefined ? distance : null);
  const isCritical = displayDistance !== null && displayDistance < 1;

  return (
    <View style={[styles.card, styles.alertCard, isCritical && styles.criticalCard]}>
      <View style={[styles.iconCircle, { backgroundColor: isCritical ? COLORS.danger : COLORS.warning }]}>
        <Ionicons name="alert-circle" size={moderateScale(24)} color={COLORS.textInverse} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: COLORS.danger }]}>Elephant Detected!</Text>
        <Text style={styles.cardMessage}>An elephant has been detected in the area. Please proceed with caution.</Text>

        {elephantPillarName && (
          <View style={styles.pillarBox}>
            <View style={styles.pillarRow}>
              <Ionicons name="location" size={moderateScale(16)} color={COLORS.info} />
              <Text style={styles.pillarLabel}>Detected At</Text>
            </View>
            <Text style={styles.pillarValue}>{elephantPillarName}</Text>
          </View>
        )}

        {esp32Data.elephantLocation && esp32Data.elephantLocation.latitude != null && esp32Data.elephantLocation.longitude != null && (
          <View style={styles.metaRow}>
            <Ionicons name="navigate-outline" size={moderateScale(13)} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>
              {Number(esp32Data.elephantLocation.latitude).toFixed(6)}, {Number(esp32Data.elephantLocation.longitude).toFixed(6)}
            </Text>
          </View>
        )}

        {(esp32Data.elephantLocation?.detectedAt || esp32Data.timestamp) && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={moderateScale(13)} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    flexDirection: 'row',
    ...SHADOWS.md,
  },
  alertCard: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
  safeCard: { borderLeftWidth: 4, borderLeftColor: COLORS.success },
  noDataCard: { borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  criticalCard: { borderLeftColor: COLORS.danger, backgroundColor: COLORS.dangerSurface },
  iconCircle: {
    width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24),
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.base, flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: moderateScale(18), fontWeight: '700', color: COLORS.text,
    marginBottom: SPACING.xs, letterSpacing: 0.2,
  },
  cardMessage: { ...FONTS.body, marginBottom: SPACING.md },
  pillarBox: {
    backgroundColor: COLORS.infoSurface, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: COLORS.info,
  },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  pillarLabel: { ...FONTS.caption, color: COLORS.info, fontWeight: '600' },
  pillarValue: { fontSize: moderateScale(17), fontWeight: '700', color: COLORS.text, marginLeft: SPACING.xl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  metaText: { ...FONTS.caption, color: COLORS.textTertiary },
});