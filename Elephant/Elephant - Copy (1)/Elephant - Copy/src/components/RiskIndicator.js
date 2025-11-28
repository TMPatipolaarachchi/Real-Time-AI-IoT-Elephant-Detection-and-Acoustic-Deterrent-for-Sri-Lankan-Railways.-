import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Vibration } from "react-native";
import { Audio } from "expo-av";

export default function RiskIndicator({ riskLevel }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null); // for storing sound object

  // -------------------------------------
  // 🔊 Play Emergency Alarm Using expo-av
  // -------------------------------------

  const playAlarm = async () => {
  try {
    console.log("Loading sound");
const { sound } = await Audio.Sound.createAsync(
  require("../../assets/alarm.mp3"),
  {},
  (status) => console.log("STATUS:", status)
);


    soundRef.current = sound;

    await sound.playAsync();
    await sound.setIsLoopingAsync(true);

    Vibration.vibrate([500, 300, 500], true);

  } catch (error) {
    console.log("Sound Error:", error);
  }
};


  // -------------------------------------
  // 🔇 Stop Alarm & Vibration
  // -------------------------------------
  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      Vibration.cancel();
    } catch (e) {
      console.log("Stop error:", e);
    }
  };

  // -------------------------------------------------
  // 🚨 Trigger alarm when risk level becomes critical
  // -------------------------------------------------
  useEffect(() => {
    if (riskLevel === "critical") {
      playAlarm();
    } else {
      stopAlarm();
    }
  }, [riskLevel]);

  // -------------------------------
  // 🔥 Pulse animation for critical
  // -------------------------------
  useEffect(() => {
    if (riskLevel === "critical") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [riskLevel]);

  if (!riskLevel || riskLevel === "none") return null;

  // -------------------------
  // ⚡ UI Config (Colors etc)
  // -------------------------
  const config = {
    critical: {
      color: "#F44336",
      backgroundColor: "#FFEBEE",
      borderColor: "#F44336",
      text: "CRITICAL RISK",
      subtext: "EMERGENCY BRAKING REQUIRED",
      icon: "🚨",
    },
    high: {
      color: "#FF5722",
      backgroundColor: "#FFF3E0",
      borderColor: "#FF5722",
      text: "HIGH RISK",
      subtext: "Proceed with caution",
      icon: "⚠️",
    },
    medium: {
      color: "#FF9800",
      backgroundColor: "#FFF8E1",
      borderColor: "#FF9800",
      text: "MEDIUM RISK",
      subtext: "Exercise caution",
      icon: "⚡",
    },
    low: {
      color: "#4CAF50",
      backgroundColor: "#E8F5E9",
      borderColor: "#4CAF50",
      text: "LOW RISK",
      subtext: "Monitor",
      icon: "ℹ️",
    },
  }[riskLevel] || {
    color: "#757575",
    backgroundColor: "#F5F5F5",
    borderColor: "#757575",
    text: "UNKNOWN",
    subtext: "Status unknown",
    icon: "❓",
  };



  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>
            {config.text}
          </Text>
          <Text style={styles.subtext}>{config.subtext}</Text>
        </View>
      </View>

      {riskLevel === "critical" && (
        <View style={styles.blinkingContainer}>
          <Text style={styles.blinkingText}>⚠️ EMERGENCY ⚠️</Text>

        </View>
      )}


      
    </Animated.View>
  );
}



const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: "#757575",
  },
  blinkingContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F44336",
    borderRadius: 8,
    alignItems: "center",
  },
  blinkingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
