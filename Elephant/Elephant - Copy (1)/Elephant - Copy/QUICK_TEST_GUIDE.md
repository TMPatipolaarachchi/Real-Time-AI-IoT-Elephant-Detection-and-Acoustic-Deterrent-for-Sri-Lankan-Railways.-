# Quick Test Guide - ESP32 Test Service

## How It Works

The `esp32TestService` sends test data to `esp32Service.processData()`, which then:
1. Stores the data in AsyncStorage
2. Notifies all listeners (like DashboardScreen)
3. Triggers distance calculation if elephant is detected

## Current Setup

The test service is **already enabled** in `DashboardScreen.js` in development mode. It will automatically start when you open the app.

## To Test It Now

1. **Open the app** - The test service should start automatically
2. **Check the console** - You should see logs like:
   ```
   Starting test scenario: elephant_detection
   [Test] Step 1/5: Initial state - no elephant
   [Test] Step 2/5: Elephant detected - low risk
   ```

3. **Watch the UI** - You should see:
   - Risk indicators changing
   - Alert cards updating
   - Distance calculations starting (if GPS is enabled)

## Manual Testing Options

### Option 1: Change Scenario in DashboardScreen.js

Edit `src/screens/DashboardScreen.js` line ~58:

```javascript
// Change this line:
esp32TestService.startScenario('elephant_detection', 5000, false);

// To any of these:
esp32TestService.startScenario('critical_distance', 5000, false);
esp32TestService.startScenario('multiple_detections', 5000, false);
esp32TestService.startScenario('rapid_risk_changes', 5000, true); // loops
esp32TestService.startRandom(10000); // random data every 10 seconds
```

### Option 2: Use Browser Console (Web) or React Native Debugger

Open console and run:

```javascript
// Import the service (if not already available)
import esp32TestService from './src/services/esp32TestService';

// Send a high risk detection
esp32TestService.sendSituation('high_risk', {
  latitude: 7.8731,
  longitude: 80.7718
});

// Send elephant departure
esp32TestService.sendSituation('departure');

// Start a scenario
esp32TestService.startScenario('elephant_detection', 3000, false);

// Stop test service
esp32TestService.stop();
```

### Option 3: Add Test Buttons to UI

You can add test buttons to the DashboardScreen for easy testing.

## Troubleshooting

### Not seeing any data?

1. **Check console logs** - Look for `[Test]` messages
2. **Verify it's enabled** - Check `DashboardScreen.js` line ~58
3. **Check if service is running**:
   ```javascript
   console.log('Test running:', esp32TestService.isTestRunning());
   console.log('Current scenario:', esp32TestService.getCurrentScenario());
   ```

### Data not updating?

1. **Check listeners** - Make sure DashboardScreen is listening to esp32Service
2. **Check AsyncStorage** - Data should be stored locally
3. **Restart the app** - Sometimes needed after code changes

### Want to disable it?

In `DashboardScreen.js`, comment out or remove:
```javascript
// esp32TestService.startScenario('elephant_detection', 5000, false);
```

## Available Scenarios

- `elephant_detection` - Full detection cycle (5 steps)
- `critical_distance` - Critical distance testing
- `multiple_detections` - Multiple elephants
- `rapid_risk_changes` - Rapid risk changes
- `continuous_monitoring` - Monitoring state

## Quick Test Commands

```javascript
// Quick high risk test
esp32TestService.sendSituation('high_risk');

// Quick departure test  
esp32TestService.sendSituation('departure');

// Start random data
esp32TestService.startRandom(5000);

// Stop everything
esp32TestService.stop();
```

