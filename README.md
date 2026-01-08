

# 🐘🚆 Real-Time AI & IoT Elephant–Train Conflict Mitigation System

**AI-Powered Solution to Reduce Elephant–Train Collisions in Sri Lanka**

Human–elephant conflicts along railway corridors are a critical conservation and safety issue. Elephant–train collisions lead to loss of elephant lives, train delays, infrastructure damage, and potential risks to passengers. This system combines **AI, IoT, and mobile technology** to provide **real-time detection, behavior analysis, risk assessment, and proactive driver alerts**.

---

## 🧠 System Overview

<img width="1417" height="1245" alt="system" src="https://github.com/user-attachments/assets/266546ad-58de-4cb8-ba6e-c52044f1acc5" />


## ✨ Project Snapshot

| Category          | Details                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| **User Roles**    | 🛤️ Train Driver · 🐘 Wildlife Conservationist                             |
| **Platforms**     | 📱 React Native (Mobile App) · 🌐 Node.js / Express · 🧠 Python ML        |
| **AI / ML**       | YOLO / CNN Object Detection · Elephant Behavior Analysis · Risk Prediction |
| **External Data** | 📡 GPS Train Tracking · 🌦 Weather Data                                    |
| **Storage**       | 🗄 firebase (users & logs) · Sensor & Detection Data                        |

---

## 🚶 User Journeys

### 🐘 Elephant Detection and Classification

* Real-time camera-based monitoring of railway zones
* Detects elephants and differentiates them from other animals or objects
* Counts elephants and classifies herd type:

  * Individual elephant
  * Herd
  * Three-part herd (adult–calf–adult)

### 🧍 Elephant Behavior Analysis

* Posture- and sound-based behavior classification:

  * Normal
  * Aggressive
* Determines whether acoustic deterrents can be safely activated

### 🔊 Acoustic Deterrent (Bee Colony Sound)

* Bio-inspired deterrent based on elephant aversion to bees
* Selectively activated based on elephant behavior and herd type
* **Safety Rule:** Avoid activation for aggressive elephants or adult–calf–adult herds to prevent harm

### 📡 Train Tracking & Distance Estimation

* GPS-based train monitoring within 10 km of detection zones
* ESP32 calculates distance between train and elephant
* Real-time updates sent to the mobile application for driver awareness

### ⚠️ Risk Assessment Module

* Considers: Elephant behavior, herd type, train distance & speed, weather conditions
* Outputs **risk level** guiding alert severity and driver instructions

### 📱 Driver Notification

* **Within 10 km:** Continuous distance updates and risk alerts
* **Within 1 km:** Emergency alerts if elephants remain on the track
* **Track Clear:** Notification that normal train operation can resume

---

## 🗂 Repository Structure

```
Elephant-Train-Conflict-System/
├── ElephantDetection/        # Elephant detection & classification models
├── elephant_behavior/        # Behavior analysis (pose & sound)
├── distancecalculation/      # Train location & distance calculation
├── Alert-system/             # Driver alert & notification logic
├── Risk_Prediction/          # Risk assessment module
└── README.md                 # Project documentation
```

---

## 🛠 Tech Stack

* **Frontend:** React Native (Expo)
* **Backend:** Node.js, Express, firebase
* **AI / ML:** YOLO / CNN, Pose & Sound-based Behavior Analysis, Risk Prediction
* **Hardware / IoT:** ESP32, Camera Units, GPS Modules, Acoustic Deterrent System
* **APIs:** Open-Meteo (Weather), Train GPS Feeds

---

## ⭐ Key Contributions

1. Real-time AI-based elephant detection and behavior analysis
2. Context-aware acoustic deterrent activation
3. GPS-integrated train proximity monitoring
4. Dynamic risk assessment using multiple real-world parameters
5. Real-time communication with train drivers via mobile application
6. Enhanced safety for elephants, trains, and passengers

---

## 👨‍🎓 Contributors

🎓 SLIIT – 4th Year IT Undergraduate Research Team

---

## 🧾 Conclusion

This project presents a **comprehensive AI- and IoT-driven solution** to mitigate elephant–train collisions in Sri Lanka. By combining **intelligent perception, behavior-aware decision-making, and real-time driver communication**, it promotes safe coexistence between wildlife and railway infrastructure while enhancing operational safety.

---
