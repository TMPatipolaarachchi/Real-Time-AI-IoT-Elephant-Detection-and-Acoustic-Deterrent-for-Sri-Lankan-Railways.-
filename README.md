<<<<<<< HEAD
# 🐘🚆 Real-Time AI & IoT Elephant–Train Conflict Mitigation System for Sri Lankan Railways

## 📌 Introduction

Human–elephant conflict has long been a critical conservation and safety issue in Sri Lanka. In recent years, elephant–train collisions have emerged as one of the most severe forms of this conflict, particularly in railway zones where elephant migration routes intersect with active train lines. These incidents result in the loss of elephant lives, damage to railway infrastructure, train delays, and potential risks to passengers and railway personnel.

Existing mitigation strategies, such as manual patrols, fixed warning signs, and basic alert systems, have demonstrated limited effectiveness. Their shortcomings include restricted spatial coverage, delayed detection, lack of real-time intelligence, and an inability to adapt responses based on elephant behavior or train dynamics. As a result, timely and informed decision-making remains a significant challenge.

To address these limitations, this research proposes a **real-time Artificial Intelligence (AI) and Internet of Things (IoT)-based system** designed specifically for elephant–train conflict mitigation in Sri Lanka. The proposed solution integrates computer vision, behavior analysis, acoustic deterrence, GPS-based train tracking, and mobile communication to enable proactive, context-aware responses that prioritize both elephant welfare and railway safety.

---

## 🧠 System Overview

<img width="1417" height="1245" alt="system" src="https://github.com/user-attachments/assets/266546ad-58de-4cb8-ba6e-c52044f1acc5" />



The proposed system continuously monitors elephant–train crossing zones using strategically installed camera units. The system operates in real time and consists of the following key functional components:

1. **Elephant Detection and Classification**
2. **Elephant Behavior (Posture and sound) Analysis**
3. **Acoustic Deterrent Control (Bee Colony Sound Simulation)**
4. **Train Tracking and Distance Estimation**
5. **Risk Assessment and Driver Notification**

Each component works collaboratively to assess risk and trigger appropriate mitigation actions.

---

## 👁️ Elephant Detection and Classification

Camera-based computer vision is used to continuously monitor railway crossing zones. The AI model:

* Detects elephants and distinguishes them from other animals or objects.
* Counts the number of detected elephants.
* Classifies elephant presence into the following categories:

  * **Individual elephant**
  * **Herd**
  * **Three-part herd (adult–calf–adult)**

This classification is critical, as different herd structures require different mitigation strategies to avoid unintended or harmful outcomes.

---

## 🧍 Elephant Behavior Analysis

Beyond detection, the system performs **posture-based behavior analysis** to classify elephant behavior into:

* **Normal behavior**
* **Aggressive behavior**

Behavior recognition is essential for assessing the potential risk of confrontation and determining whether deterrent actions should be activated.

---

## 🔊 Acoustic Deterrent System (Bee Colony Sound)

The system incorporates a bio-inspired acoustic deterrent mechanism based on elephant aversion to bees.

* A sound system simulates the natural sound of an active bee colony.
* The deterrent is **selectively activated** based on:

  * Elephant behavior (normal or aggressive)
  * Elephant group classification

### Safety Rule

To avoid negative consequences, **the bee colony sound is NOT activated** when:

* Elephants exhibit aggressive behavior **and**
* Elephants are classified as a **three-part herd (adult–calf–adult)**

This rule ensures the safety of calves and prevents escalation of aggressive responses.

---

## 📡 Train Tracking and Distance Estimation

The system integrates GPS-based train tracking to identify trains operating near elephant detection zones.

* Trains within a **10 km radius** of the elephant detection point are continuously monitored.
  
* After elephant detection:
* The train GPS coordinates are collected
* The distance between the train and the elephant location is calculated
* This distance calculation is done using the ESP32
* After calculation, the distance data is sent to the mobile application
  
This real-time spatial awareness allows the system to adapt responses dynamically as trains approach.

---

## ⚠️ Risk Assessment Module

When elephants are detected—especially in aggressive states or speed or weather —the system performs a comprehensive risk assessment using:

* Elephant behavior (normal or aggressive)
* Elephant group classification
* Distance between the train and elephants
* Speed of the approaching train
* Weather

The output is a **risk level** that guides alert severity and driver instructions.

---

## 📱 Driver Notification and Mobile Application

A dedicated mobile application is used to communicate real-time information to train drivers.

### Notification Logic

* **Within 10 km**:

  * Drivers receive distance updates, assessed risk levels, and alerts.

* **More than 1 km away**:

  * Drivers are instructed to slow down and remain alert.
  * Real-time monitoring continues to confirm elephant presence or movement.

* **Within 1 km**:

  * If elephants are still present on the track, an **emergency warning** is sent immediately.
  * This accounts for insufficient time to rely solely on deterrent measures.

* **Elephants have left the track**:

  * Drivers are notified that the track is clear and normal operation may resume.

This continuous feedback loop ensures timely decision-making and minimizes collision risk.

---

## ⭐ Key Contributions

* Real-time AI-based elephant detection and behavior analysis
* Context-aware acoustic deterrent activation
* GPS-integrated train proximity monitoring
* Dynamic risk assessment using multiple real-world parameters
* Direct, actionable communication with train drivers via a mobile application

---

## 🗂️ Repository Structure (Overview)

```
├── ElephantDetection/          # Elephant detection and behavior analysis models
├── elephent_behavior/          # elephent behavior using posed and sound
├── distancecalculation/        # Train location and distance calculation modules
├── Alert-system/               # Driver alert and notification system
├── Risk_Prediction/            # Risk prediction 
└── README.md                   # Project documentation
```

---

## 🧾 Conclusion

This project presents a comprehensive AI- and IoT-driven approach to mitigating elephant–train conflicts in Sri Lanka. By combining intelligent perception, behavior-aware decision-making, and real-time communication, the system aims to reduce elephant fatalities, enhance railway safety, and promote sustainable coexistence between wildlife and transportation infrastructure.

---

## 🔗 GitHub Repository

Project Repository:
**Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways**
=======

>>>>>>> origin/development
