# Troubleshooting Guide

## PlatformConstants Error Fix

If you're seeing the error:
```
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found
```

This is typically caused by an Expo Go app version mismatch. Follow these steps:

### Solution 1: Update Expo Go App
1. **On your device**, go to App Store (iOS) or Play Store (Android)
2. **Update Expo Go** to the latest version
3. **Restart** the Expo Go app
4. **Clear the app cache** in Expo Go (shake device → Settings → Clear cache)

### Solution 2: Clear All Caches
1. **Stop the Expo server** (Ctrl+C in terminal)
2. **Clear Expo cache:**
   ```bash
   npx expo start -c
   ```
3. **Clear Metro bundler cache:**
   ```bash
   npx react-native start --reset-cache
   ```
4. **Clear node_modules and reinstall:**
   ```bash
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   npm install
   ```

### Solution 3: Verify Expo Go SDK Compatibility
- Make sure your **Expo Go app version supports SDK 54**
- Check Expo Go version in app settings
- If needed, uninstall and reinstall Expo Go

### Solution 4: Restart Development Server
1. Close the Expo Go app on your device
2. Stop the development server
3. Run: `npx expo start -c`
4. Scan the QR code again

### Solution 5: Check Device Connection
- Ensure your device and computer are on the **same Wi-Fi network**
- Try using **Tunnel mode** if LAN doesn't work:
  ```bash
  npx expo start --tunnel
  ```

## Other Common Issues

### GPS Not Working
- Grant location permissions in device settings
- Enable location services
- Restart the app

### ESP32 Data Not Received
- Check if simulation is enabled (for testing)
- Verify ESP32 connection (for production)
- Check network connectivity

### App Crashes
- Clear all caches (see Solution 2)
- Reinstall dependencies
- Check Expo Go version compatibility

## Still Having Issues?

1. Check that you're using **Expo Go version that supports SDK 54**
2. Try creating a fresh Expo project and copying your code
3. Check Expo documentation for SDK 54 compatibility

