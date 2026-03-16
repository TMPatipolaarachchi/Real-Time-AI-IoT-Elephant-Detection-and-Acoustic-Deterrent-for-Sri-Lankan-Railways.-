# 🐘🚆 Real-Time AI & IoT Elephant–Train Conflict Mitigation System

**AI-Powered Solution to Reduce Elephant–Train Collisions in Sri Lanka**

Human–elephant conflicts along railway corridors are a critical conservation and public safety issue in Sri Lanka. Elephant–train collisions result in the loss of elephant lives, train delays, infrastructure damage, and potential risks to passengers.

This project introduces a **real-time AI- and IoT-driven system** that integrates **computer vision, behavior analysis, GPS-based train tracking, risk prediction, and mobile alerts** to proactively mitigate elephant–train collisions.

---

## 🎥 System Demonstration

<video src="Media1.mp4" controls width="900"></video>

*(Upload `Media1.mp4` to the repository root for the video to display.)*

---

## 🧠 System Overview

<img width="1417" height="1245" alt="System Architecture" src="https://github.com/user-attachments/assets/266546ad-58de-4cb8-ba6e-c52044f1acc5" />

---

## ✨ Project Snapshot

| Category          | Details                                                                 |
|------------------|-------------------------------------------------------------------------|
| **User Roles**    | 🛤️ Train Driver · 🐘 Wildlife Conservationist                           |
| **Platforms**     | 📱 React Native (Mobile App) · 🌐 Node.js / Express · 🧠 Python (ML)    |
| **AI / ML**       | YOLO / CNN Object Detection · Behavior Analysis · Risk Prediction       |
| **External Data** | 📡 GPS Train Tracking · 🌦 Weather Data                                |
| **Storage**       | 🗄 Firebase (Users & Logs) · Sensor & Detection Data                    |

---

## 🚶 User Journeys

### 🐘 Elephant Detection and Classification
- Real-time camera-based monitoring of railway zones
- Accurate detection of elephants while filtering non-relevant objects
- Elephant counting and herd classification:
  - Individual elephant
  - Herd
  - Adult–Calf–Adult group

### 🧍 Elephant Behavior Analysis
- Posture-based pose estimation
- Sound-based behavior analysis
- Classification into:
  - Normal
  - Aggressive
- Determines safe activation of deterrent mechanisms

### 🔊 Acoustic Deterrent (Bee Colony Sound)
- Bio-inspired deterrent based on elephants’ natural aversion to bees
- Activated selectively based on behavior and herd type
- **Safety Rule:** Deterrent is disabled for aggressive elephants and adult–calf–adult groups to avoid unintended harm

### 📡 Train Tracking & Distance Estimation
- GPS-based train monitoring within a 10 km radius
- ESP32-based real-time distance calculation
- Continuous distance updates sent to the driver mobile application

### ⚠️ Risk Assessment Module
- Considers:
  - Elephant behavior
  - Herd type
  - Train speed and distance
  - Weather conditions
- Generates a **dynamic risk level** to guide alert severity and driver response

### 📱 Driver Notification System
- **Within 10 km:** Continuous alerts and distance updates
- **Within 1 km:** High-priority emergency alerts
- **Track Clear:** Confirmation message allowing normal train operation

---

## 🛠 Technology Stack & Dependencies

### Frontend
- React Native (Expo)

### Backend
- Firebase (Authentication & Logs)

### AI / ML
- YOLO / CNN for Elephant Detection
- Pose Estimation 
- Sound Classification Models
- Risk Prediction Model

### IoT & Hardware
- Raspberry Pi
- Camera Modules
- GPS Modules
- Speaker (Acoustic Deterrent)

### External APIs
- Open-Meteo (Weather Data)
- Train GPS Feeds

---

## 🗂 Repository Structure

```
Elephant-Train-Conflict-System/
├── ElephantDetection/        # Elephant detection & classification models
├── elephant_behavior/        # Pose & sound-based behavior analysis
├── distancecalculation/      # Train GPS tracking & distance estimation
├── Alert-system/             # Driver alert & notification logic
├── Risk_Prediction/          # Multi-factor risk assessment module
└── README.md                 # Project documentation
```

---

## 🛠 Technology Stack

- **Frontend:** React Native (Expo)
- **Backend:** Node.js, Express.js, Firebase
- **AI / ML:** YOLO / CNN, Pose Estimation, Sound Classification, Risk Prediction Models
- **Hardware / IoT:** ESP32, Camera Modules, GPS Units, Acoustic Deterrent System
- **APIs:** Open-Meteo (Weather Data), Train GPS Feeds

---

## ⭐ Key Contributions

1. Real-time AI-based elephant detection and classification
2. Behavior-aware decision-making using pose and sound analysis
3. Context-sensitive acoustic deterrent activation
4. GPS-integrated train proximity and distance monitoring
5. Multi-parameter dynamic risk assessment
6. Real-time mobile alerts to train drivers
7. Improved safety for elephants, railway operations, and passengers

---

## 👨‍🎓 Contributors

🎓 **SLIIT – 4th Year IT Undergraduate Research Team**

---

## 🧾 Conclusion

This project presents a **comprehensive AI- and IoT-enabled solution** to mitigate elephant–train collisions in Sri Lanka. By combining **intelligent perception, behavior-aware risk assessment, and real-time driver communication**, the system supports safer railway operations while promoting sustainable coexistence between wildlife and transportation infrastructure.

---

## 🔗 Repository

https://github.com/TMPatipolaarachchi/Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-.git
