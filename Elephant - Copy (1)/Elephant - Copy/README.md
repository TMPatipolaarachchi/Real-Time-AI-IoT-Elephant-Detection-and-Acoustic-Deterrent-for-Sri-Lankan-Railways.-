# Elephant Detection Mobile Application

A React Native mobile application for real-time elephant detection and train collision prevention, built with Expo SDK 54.

## Features

### 🔐 Authentication
- Username and PIN-based authentication
- Secure local storage of credentials
- Profile management with photo upload

### 📍 Real-time GPS Tracking
- Automatic GPS permission requests
- Continuous location tracking
- Real-time train position updates

### 🐘 Elephant Detection Alerts
- Real-time alerts from ESP32 IoT devices
- Elephant detection notifications
- Elephant departure notifications
- Offline-first architecture with local data storage

### 📏 Distance Calculation
- Haversine formula for accurate distance calculation
- Automatic updates every 5 seconds
- Real-time distance display until reaching 0
- Critical distance warnings (< 1 km)

### ⚠️ Risk Assessment
- Dynamic risk level display (Low/Medium/High/Critical)
- Visual risk indicators with color coding
- Emergency braking warnings for critical situations
- Real-time risk updates from ESP32

### 📱 Professional UI/UX
- Modern, clean interface
- Intuitive navigation
- Responsive design
- Smooth animations and transitions

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Run on your device:
   - Install Expo Go app on your Android/iOS device
   - Scan the QR code displayed in the terminal
   - Make sure your device and computer are on the same network

## Project Structure

```
├── App.js                 # Main app entry point with navigation
├── src/
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   └── ProfileScreen.js
│   ├── components/       # Reusable UI components
│   │   ├── AlertCard.js
│   │   ├── DistancePanel.js
│   │   └── RiskIndicator.js
│   ├── services/         # Business logic services
│   │   ├── locationService.js
│   │   ├── esp32Service.js
│   │   └── distanceService.js
│   ├── utils/            # Utility functions
│   │   └── haversine.js
│   └── context/          # React context providers
│       └── AuthContext.js
├── package.json
├── app.json
└── babel.config.js
```

## ESP32 Integration

The app is designed to receive data from ESP32 devices. The expected data format:

```javascript
{
  elephantDetected: boolean,
  elephantLocation: {
    latitude: number,
    longitude: number
  },
  riskLevel: 'low' | 'medium' | 'high',
  elephantLeft: boolean,
  timestamp: string (ISO format)
}
```

### Connecting to ESP32

To connect to your ESP32 device, modify `src/services/esp32Service.js`:

1. Replace the simulation with WebSocket or HTTP connection
2. Implement the data reception handler
3. Call `esp32Service.processData(data)` when data is received

Example WebSocket integration:
```javascript
const ws = new WebSocket('ws://your-esp32-ip:port');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  esp32Service.processData(data);
};
```

## Key Technologies

- **React Native** - Cross-platform mobile framework
- **Expo SDK 54** - Development platform and tooling
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **Expo Location** - GPS tracking
- **Expo Image Picker** - Profile picture upload

## Permissions

The app requires the following permissions:

- **Location (GPS)**: Required for calculating train-elephant distances
- **Photo Library**: Required for uploading profile pictures

## Distance Calculation

The app uses the Haversine formula to calculate the great-circle distance between two GPS coordinates:

- Updates automatically every 5 seconds
- Continues until distance reaches 0 (or < 0.001 km)
- Displays distance in meters (< 1 km) or kilometers (≥ 1 km)

## Risk Levels

- **Low Risk**: Green indicator, monitor situation
- **Medium Risk**: Orange indicator, exercise caution
- **High Risk**: Red-orange indicator, proceed with extreme caution
- **Critical Risk**: Red indicator with emergency warning, distance < 1 km

## Development

### Running on Expo Go

1. Ensure you have Expo Go installed on your device
2. Run `npm start`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Offline-First Architecture

The app stores all ESP32 data locally using AsyncStorage:
- Alerts are cached for offline viewing
- Last known state is preserved
- Data persists across app restarts

## License

This project is developed for elephant-train collision prevention systems.

