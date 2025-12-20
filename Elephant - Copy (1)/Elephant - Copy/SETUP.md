# Setup Guide - Elephant Detection Mobile App

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app installed on your Android/iOS device
- Expo CLI (optional, but recommended)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify Expo SDK 54:**
   The app uses Expo SDK 54. Verify your installation:
   ```bash
   npx expo --version
   ```
   Should show version 54.x.x

## Running the App

### Development Mode (Expo Go)

1. **Start the development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **Run on your device:**
   - **Android**: Open Expo Go app and scan the QR code
   - **iOS**: Open Camera app and scan the QR code (will open in Expo Go)

3. **Alternative methods:**
   ```bash
   # Run on Android emulator/device
   npm run android
   
   # Run on iOS simulator/device
   npm run ios
   
   # Run on web browser
   npm run web
   ```

## Configuration

### ESP32 Connection

By default, the app is set up to receive data from ESP32 devices. To connect to your ESP32:

1. **For Testing (Development):**
   - Open `src/screens/DashboardScreen.js`
   - Uncomment the line: `esp32Service.startSimulation(true);`
   - This enables simulated ESP32 data for testing

2. **For Production:**
   - Modify `src/services/esp32Service.js`
   - Implement WebSocket or HTTP connection to your ESP32 device
   - See `TESTING.md` for example implementation

### GPS Permissions

The app will automatically request GPS permissions on first launch. Ensure:
- Location services are enabled on your device
- App has location permissions granted
- GPS is enabled in device settings

## Project Structure

```
├── App.js                 # Main app entry with navigation
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── babel.config.js       # Babel configuration
├── assets/               # App assets (icons, splash screens)
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
│   │   ├── haversine.js
│   │   └── esp32Simulator.js
│   └── context/          # React context providers
│       └── AuthContext.js
```

## Key Features

### 1. Authentication
- Username and PIN-based login
- Secure local storage
- Profile management with photo upload

### 2. Real-time GPS Tracking
- Automatic GPS permission requests
- Continuous location tracking
- Updates every 5 seconds

### 3. Distance Calculation
- Haversine formula for accurate distance
- Calculates until distance reaches 0 (0.1 meters)
- Displays distance in meters (< 1 km) or kilometers (≥ 1 km)

### 4. ESP32 Integration
- Receives real-time alerts from ESP32
- Displays risk levels (Low/Medium/High)
- Shows elephant detection status
- Handles elephant departure notifications

### 5. Risk Assessment
- Dynamic risk level display
- Critical risk warning when distance < 1 km
- Emergency braking recommendations

## Troubleshooting

### Common Issues

1. **Expo Go version mismatch:**
   - Ensure you have Expo Go app that supports SDK 54
   - Update Expo Go from App Store/Play Store

2. **GPS not working:**
   - Check device location settings
   - Grant location permissions
   - Restart the app

3. **ESP32 data not received:**
   - Check if simulation is enabled (for testing)
   - Verify ESP32 connection (for production)
   - Check network connectivity

4. **Distance not calculating:**
   - Ensure GPS is enabled
   - Verify both locations are available
   - Check console for errors

5. **App crashes on startup:**
   - Clear cache: `expo start -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check Expo Go version compatibility

### Clearing Cache

```bash
# Clear Expo cache
expo start -c

# Clear Metro bundler cache
npx react-native start --reset-cache
```

## Production Build

### Building for Android/iOS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build:**
   ```bash
   # Android
   eas build --platform android
   
   # iOS
   eas build --platform ios
   ```

## Dependencies

All dependencies are configured for Expo SDK 54:
- `expo`: ~54.0.0
- `react-native`: 0.76.5
- `react`: 18.3.1
- `@react-navigation/native`: ^6.1.18
- `expo-location`: ~18.0.4
- `expo-image-picker`: ~16.0.3
- `@react-native-async-storage/async-storage`: 2.1.0

## Support

For issues or questions:
1. Check `TESTING.md` for testing scenarios
2. Review `README.md` for feature documentation
3. Check Expo documentation for SDK 54

## License

This project is developed for elephant-train collision prevention systems.

