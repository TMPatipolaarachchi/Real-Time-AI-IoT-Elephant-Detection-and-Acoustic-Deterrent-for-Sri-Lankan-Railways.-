# Testing Guide

## Testing the Mobile Application

### Prerequisites
1. Install Expo Go on your Android/iOS device
2. Ensure your device and computer are on the same network
3. Run `npm install` to install dependencies

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. Scan the QR code with:
   - **Android**: Expo Go app
   - **iOS**: Camera app (will open in Expo Go)

### Testing Features

#### 1. Authentication
- **Username**: Enter any username (e.g., "driver1")
- **PIN**: Enter any 4-digit PIN (e.g., "1234")
- Click "Login" to access the dashboard

#### 2. GPS Testing
- The app will request GPS permissions on first launch
- Grant location permissions to enable distance calculation
- The GPS status indicator should turn green when active

#### 3. ESP32 Data Simulation (Testing Mode)

To test with simulated ESP32 data, you can enable test mode by modifying `src/screens/DashboardScreen.js`:

```javascript
// Add this in the useEffect hook
useEffect(() => {
  // ... existing code ...
  
  // Enable simulation for testing (remove in production)
  if (__DEV__) {
    esp32Service.startSimulation(true);
  }
  
  // ... rest of code ...
}, []);
```

Or manually trigger test data:

```javascript
// In DashboardScreen, add a test button (for development only)
import { simulateESP32Data } from '../utils/esp32Simulator';

// Then call:
const interval = simulateESP32Data((data) => {
  esp32Service.processData(data);
}, 10000); // Update every 10 seconds
```

#### 4. Testing Distance Calculation

1. Enable GPS on your device
2. Grant location permissions
3. When elephant is detected (via simulation or real ESP32):
   - Distance should start calculating
   - Updates every 5 seconds
   - Distance decreases as you move (if testing on device)
   - Critical warning appears when distance < 1 km

#### 5. Testing Risk Levels

The app displays different risk levels:
- **Low Risk**: Green indicator
- **Medium Risk**: Orange indicator  
- **High Risk**: Red-orange indicator
- **Critical Risk**: Red with emergency warning (< 1 km)

#### 6. Testing Profile Features

1. Navigate to Profile tab
2. Tap the profile picture area
3. Select a photo from your gallery
4. Photo should be saved and displayed
5. Test logout functionality

### Manual ESP32 Data Testing

You can manually inject test data using the browser console or a test button:

```javascript
// Example test data
const testData = {
  elephantDetected: true,
  elephantLocation: {
    latitude: 7.8731,
    longitude: 80.7718,
  },
  riskLevel: 'high',
  elephantLeft: false,
  timestamp: new Date().toISOString(),
};

esp32Service.processData(testData);
```

### Testing Scenarios

#### Scenario 1: Elephant Detection
1. Simulate elephant detection
2. Verify alert appears
3. Verify distance calculation starts
4. Verify risk indicator shows appropriate level

#### Scenario 2: Critical Distance
1. Set elephant location close to train location
2. Verify critical risk warning appears
3. Verify emergency braking message displays

#### Scenario 3: Elephant Departure
1. Simulate elephant detection
2. Then simulate elephant left
3. Verify "All Clear" message appears
4. Verify distance calculation stops

#### Scenario 4: Offline Mode
1. Disable network connection
2. Verify app still works with stored data
3. Verify alerts are cached locally

### Production Setup

Before deploying to production:

1. **Remove test simulation code** from DashboardScreen
2. **Implement actual ESP32 connection** in `esp32Service.js`:
   - Replace simulation with WebSocket/HTTP connection
   - Connect to your ESP32 device IP/endpoint
   - Handle connection errors and reconnection

3. **Example WebSocket connection**:
```javascript
// In esp32Service.js
connectToESP32(wsUrl) {
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('Connected to ESP32');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      this.processData(data);
    } catch (error) {
      console.error('Error parsing ESP32 data:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('Disconnected from ESP32');
    // Implement reconnection logic
  };
}
```

### Troubleshooting

**GPS not working:**
- Check device location settings
- Ensure location permissions are granted
- Try restarting the app

**No ESP32 data:**
- Check if simulation is enabled (for testing)
- Verify ESP32 connection (in production)
- Check network connectivity

**Distance not calculating:**
- Ensure GPS is enabled and permissions granted
- Verify both train and elephant locations are available
- Check console for errors

**App crashes:**
- Check Expo Go version (should support SDK 54)
- Clear app cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

