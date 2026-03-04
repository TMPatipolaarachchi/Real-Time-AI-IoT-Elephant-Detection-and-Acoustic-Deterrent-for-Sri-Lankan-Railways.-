import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Vibration } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, moderateScale,
} from "../theme";

export default function RiskIndicator({ riskLevel }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);

  const playAlarm = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alarm.mp3"), {}, () => {}
      );
      soundRef.current = sound;
      await sound.playAsync();
      await sound.setIsLoopingAsync(true);
      Vibration.vibrate([500, 300, 500], true);
    } catch (error) {}
  };

  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      Vibration.cancel();
    } catch (e) {}
  };

  useEffect(() => {
    if (riskLevel === "critical") { playAlarm(); } else { stopAlarm(); }
    return () => { stopAlarm(); };
  }, [riskLevel]);

  useEffect(() => {
    if (riskLevel === "critical") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else { pulseAnim.setValue(1); }
  }, [riskLevel]);

  if (!riskLevel || riskLevel === "none") return null;

  const config = {
    critical: {
      bg: COLORS.dangerSurface, border: COLORS.danger, color: COLORS.danger,
      text: "CRITICAL RISK", subtext: "EMERGENCY BRAKING REQUIRED",
      icon: "warning", iconBg: COLORS.danger,
    },
    high: {
      bg: COLORS.warningSurface, border: COLORS.warning, color: COLORS.warning,
      text: "HIGH RISK", subtext: "Proceed with extreme caution",
      icon: "alert-circle", iconBg: COLORS.warning,
    },
    medium: {
      bg: COLORS.accentSurface, border: COLORS.accent, color: COLORS.accentDark,
      text: "MEDIUM RISK", subtext: "Exercise caution ahead",
      icon: "flash", iconBg: COLORS.accent,
    },
    low: {
      bg: COLORS.successSurface, border: COLORS.success, color: COLORS.success,
      text: "LOW RISK", subtext: "Monitoring active",
      icon: "information-circle", iconBg: COLORS.success,
    },
  }[riskLevel] || {
    bg: COLORS.background, border: COLORS.border, color: COLORS.textTertiary,
    text: "UNKNOWN", subtext: "Status unknown",
    icon: "help-circle", iconBg: COLORS.textTertiary,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={moderateScale(24)} color={COLORS.textInverse} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>{config.text}</Text>
          <Text style={styles.subtext}>{config.subtext}</Text>
        </View>
      </View>
      {riskLevel === "critical" && (
        <View style={styles.emergencyBar}>
          <Ionicons name="warning" size={moderateScale(14)} color={COLORS.textInverse} />
          <Text style={styles.emergencyText}>EMERGENCY</Text>
          <Ionicons name="warning" size={moderateScale(14)} color={COLORS.textInverse} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.md,
  },
  content: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24),
    justifyContent: "center", alignItems: "center", marginRight: SPACING.base,
  },
  textContainer: { flex: 1 },
  title: { fontSize: moderateScale(20), fontWeight: "800", letterSpacing: 0.5, marginBottom: SPACING.xs },
  subtext: { ...FONTS.body, color: COLORS.textSecondary },
  emergencyBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md, gap: SPACING.sm,
  },
  emergencyText: {
    color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: "800", letterSpacing: 2,
  },
});