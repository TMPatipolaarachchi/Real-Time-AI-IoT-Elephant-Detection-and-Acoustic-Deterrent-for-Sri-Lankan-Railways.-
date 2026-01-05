# 🐘 Real-Time AI IoT Elephant Detection and Acoustic Deterrent for Sri Lankan Railways

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TMPatipolaarachchi/Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.0-000020.svg)](https://expo.dev/)
[![ESP32](https://img.shields.io/badge/ESP32-IoT-green.svg)](https://www.espressif.com/en/products/socs/esp32)

A comprehensive real-time system designed to protect both elephants and train passengers in Sri Lanka by detecting elephants near railway tracks and providing acoustic deterrents and alerts to train drivers.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [ESP32 Hardware Setup](#esp32-hardware-setup)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Human-elephant conflict is a critical issue in Sri Lanka, particularly along railway corridors. This system leverages IoT technology, GPS tracking, and real-time communication to:

- **Detect** elephants near railway tracks using strategically placed sensors
- **Alert** train drivers in real-time when approaching areas with detected elephants
- **Deter** elephants from tracks using acoustic signals
- **Track** train positions and calculate distances to danger zones
- **Manage** multiple detection pillars along the railway network

The system consists of a mobile application for train drivers and ESP32-based IoT devices deployed as detection pillars along the railway tracks.

## ✨ Features

### Mobile Application
- **Real-time Elephant Detection Alerts**: Instant notifications when elephants are detected ahead
- **Distance Calculation**: Precise distance calculation from train to detected elephants
- **Acoustic Warning System**: Automatic audio alerts for drivers based on proximity
- **GPS-based Tracking**: Continuous monitoring of train location
- **Risk Indicator**: Visual risk level display (Safe, Warning, Danger)
- **Pillar Management**: View and manage detection pillars along the route
- **Calibration System**: Configure detection zones and distances
- **User Authentication**: Secure Firebase-based authentication
- **Offline Support**: Functions with limited connectivity using local storage
- **Profile Management**: Driver profile with train and route information

### ESP32 IoT System
- **GPS Location Tracking**: Real-time location monitoring of pillars
- **Elephant Detection Interface**: Integration with detection sensors
- **Web-based Configuration**: User-friendly web interface for pillar management
- **Persistent Storage**: LittleFS-based storage for pillar and waypoint data
- **Bulk Import**: Spreadsheet-style bulk import of railway track data
- **WiFi Connectivity**: Real-time communication with mobile app via WiFi
- **Multiple Pillar Support**: Manage up to 50 detection pillars
- **Waypoint System**: Track up to 200 waypoints along the railway

## 🏗 System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Mobile App     │ ←─────→ │  Firebase Cloud  │ ←─────→ │   ESP32 IoT     │
│  (React Native) │  WiFi   │   Firestore DB   │  WiFi   │   Pillars       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │                            │
         ├─ GPS Tracking             ├─ Data Sync                ├─ GPS Module
         ├─ Distance Calc            ├─ Authentication           ├─ Detection Sensors
         ├─ Audio Alerts             └─ Real-time Updates        ├─ Web Interface
         └─ Risk Indication                                       └─ Data Storage
```

## 🛠 Technology Stack

### Mobile Application
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: React Context API
- **Location Services**: Expo Location
- **Audio**: Expo AV
- **Storage**: AsyncStorage & Expo Secure Store
- **Sensors**: Expo Sensors (Accelerometer, Gyroscope)

### IoT Hardware
- **Microcontroller**: ESP32
- **Storage**: LittleFS (Flash-based persistent storage)
- **Web Server**: ESP32 WebServer
- **Data Format**: JSON with ArduinoJson library
- **Connectivity**: WiFi

### Database
- **Cloud Database**: Firebase Firestore
- **Local Storage**: AsyncStorage (Mobile), LittleFS (ESP32)

## 📦 Prerequisites

### For Mobile App Development
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Firebase account with project setup

### For ESP32 Development
- Arduino IDE (v1.8.x or higher) or PlatformIO
- ESP32 board support package
- USB cable for ESP32 programming
- Required Arduino libraries:
  - WiFi (built-in)
  - WebServer (built-in)
  - ArduinoJson (v6.x)
  - LittleFS (built-in)

## 🚀 Installation

### Mobile Application Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TMPatipolaarachchi/Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-.git
   cd Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-/Elephant\ New
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase** (see [Configuration](#configuration) section)

4. **Start the development server**
   ```bash
   # For all platforms
   npm start

   # For Android
   npm run android

   # For iOS
   npm run ios

   # For web
   npm run web
   ```

### ESP32 Setup

1. **Open Arduino IDE** and install ESP32 board support:
   - Go to File → Preferences
   - Add to Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Go to Tools → Board → Boards Manager
   - Search "ESP32" and install

2. **Install required libraries**:
   - Go to Sketch → Include Library → Manage Libraries
   - Install "ArduinoJson" (version 6.x)

3. **Open the ESP32 sketch**:
   - Navigate to `Elephant New/esp32/esp32.ino`
   - Open in Arduino IDE

4. **Configure WiFi credentials** (see [Configuration](#configuration) section)

5. **Upload to ESP32**:
   - Select your ESP32 board from Tools → Board
   - Select the correct COM port from Tools → Port
   - Click Upload button

## ⚙️ Configuration

### Firebase Configuration

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Email/Password authentication

3. **Create Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in production mode or test mode

4. **Get your Firebase config**:
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click on the web app icon (</>)
   - Copy the configuration object

5. **Update Firebase configuration**:
   - Edit `Elephant New/src/config/firebaseConfig.js`
   - Replace with your Firebase configuration:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### ESP32 Configuration

1. **Update WiFi credentials** in `esp32.ino`:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. **Note the ESP32 IP address** after upload (shown in Serial Monitor)

3. **Update ESP32 IP in mobile app**:
   - The app will typically discover ESP32 devices on the same network
   - Or manually configure in the app settings

## 📱 Usage

### For Train Drivers

1. **Login**: Open the app and login with your credentials

2. **Dashboard**: View real-time information:
   - Current location and speed
   - Nearby elephant detection alerts
   - Distance to detected elephants
   - Risk level indicator

3. **Calibration**: Configure detection parameters:
   - Add/edit detection pillars
   - Set detection distances
   - Import waypoint data from CSV
   - Sync with ESP32 devices

4. **Profile**: Update driver information and settings

### For System Administrators

1. **Access ESP32 Web Interface**:
   - Connect to the same WiFi network as ESP32
   - Open browser and navigate to ESP32's IP address
   - Example: `http://192.168.1.100`

2. **Manage Pillars**:
   - Add new detection pillars with GPS coordinates
   - Mark elephants as detected at specific pillars
   - View system statistics

3. **Import Railway Data**:
   - Prepare CSV file with waypoint data
   - Use bulk import feature in web interface
   - Format: `id,index,trackPathId,lat,lon,front,back,pillarId,description`

## 🔧 ESP32 Hardware Setup

### Components Required
- ESP32 Development Board
- GPS Module (compatible with ESP32)
- Power Supply (5V, 2A recommended)
- WiFi network access
- Optional: Elephant detection sensors (PIR, camera, etc.)

### Wiring Diagram
```
ESP32          GPS Module
─────          ──────────
3.3V    ───→   VCC
GND     ───→   GND
GPIO16  ───→   TX
GPIO17  ───→   RX
```

### First-time Setup

1. Power on the ESP32
2. Connect to the ESP32's WiFi network (if in AP mode)
3. Access the web interface at `192.168.4.1`
4. Configure your WiFi credentials
5. ESP32 will restart and connect to your network
6. Note the new IP address for future access

## 📂 Project Structure

```
Real-Time-AI-IoT-Elephant-Detection/
├── Elephant New/
│   ├── App.js                      # Main application entry point
│   ├── app.json                    # Expo configuration
│   ├── package.json                # Dependencies
│   ├── babel.config.js             # Babel configuration
│   ├── assets/                     # Images, sounds, fonts
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   └── RiskIndicator.js    # Risk level display component
│   │   ├── config/                 # Configuration files
│   │   │   └── firebaseConfig.js   # Firebase configuration
│   │   ├── context/                # React Context providers
│   │   │   └── AuthContext.js      # Authentication context
│   │   ├── screens/                # Application screens
│   │   │   ├── LoginScreen.js      # Login/authentication
│   │   │   ├── DashboardScreen.js  # Main dashboard
│   │   │   ├── CalibrationScreen.js # Pillar management
│   │   │   └── ProfileScreen.js    # User profile
│   │   ├── services/               # Business logic services
│   │   │   ├── authService.js      # Authentication
│   │   │   ├── locationService.js  # GPS tracking
│   │   │   ├── distanceService.js  # Distance calculations
│   │   │   ├── pillarService.js    # Pillar management
│   │   │   ├── waypointService.js  # Waypoint handling
│   │   │   ├── esp32Service.js     # ESP32 communication
│   │   │   ├── calibrationService.js # Calibration logic
│   │   │   └── notificationSyncService.js # Notifications
│   │   └── utils/                  # Utility functions
│   │       └── haversine.js        # Distance calculations
│   └── esp32/
│       ├── esp32.ino               # ESP32 Arduino sketch
│       └── Test_Railway_Track_new.csv # Sample railway data
└── README.md                       # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit your changes**: `git commit -m 'Add some feature'`
4. **Push to the branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Test your changes thoroughly
- Update documentation as needed
- Ensure no breaking changes to existing functionality

## 📄 License

This project is developed for the Sri Lankan Railway system to enhance safety for both elephants and passengers. 

## 🙏 Acknowledgments

- Sri Lankan Railway Department
- Wildlife conservation organizations
- All contributors and testers

## 📞 Support

For issues, questions, or suggestions:
- Open an issue in the GitHub repository
- Contact the maintainer: TMPatipolaarachchi

## 🔐 Security

- Never commit Firebase credentials or API keys to the repository
- Use environment variables or secure configuration files
- Keep ESP32 WiFi credentials secure
- Regularly update dependencies for security patches

## 🚦 System Status Indicators

| Status | Color | Distance | Action |
|--------|-------|----------|--------|
| Safe | Green | > 3000m | Normal operation |
| Warning | Yellow | 1000-3000m | Alert driver, reduce speed |
| Danger | Red | < 1000m | Emergency alert, sound acoustic deterrent |

## 📊 Features Roadmap

- [ ] Machine learning-based elephant detection
- [ ] Multi-language support (Sinhala, Tamil, English)
- [ ] Advanced analytics dashboard
- [ ] Integration with railway control systems
- [ ] Mobile app for railway officials
- [ ] Automated reporting system
- [ ] Camera integration for visual confirmation
- [ ] Solar-powered ESP32 pillars

---

**Made with ❤️ for the safety of elephants and passengers in Sri Lanka**