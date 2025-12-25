import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.watchSubscription = null;
    this.currentLocation = null;
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      return null;
    }
  }

  /**
   * Watch location changes
   * @param {function} callback - Callback function to receive location updates
   * @param {number} interval - Update interval in milliseconds (default: 5000)
   */
  async watchLocation(callback, interval = 5000) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        callback(null);
        return;
      }

      // watchPositionAsync returns a Promise that resolves to a subscription
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: interval,
          distanceInterval: 0, // Update even without movement
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          };
          callback(this.currentLocation);
        }
      );

      // Store the subscription object (not the Promise)
      this.watchSubscription = subscription;
    } catch (error) {
      callback(null);
    }
  }

  /**
   * Stop watching location
   */
  stopWatching() {
    try {
      if (this.watchSubscription) {
        // Check if it's a subscription object with remove method
        if (typeof this.watchSubscription.remove === 'function') {
          this.watchSubscription.remove();
        } else if (typeof this.watchSubscription.then === 'function') {
          // If it's still a Promise, wait for it and then remove
          this.watchSubscription.then((subscription) => {
            if (subscription && typeof subscription.remove === 'function') {
              subscription.remove();
            }
          }).catch((error) => {
          });
        }
        this.watchSubscription = null;
      }
    } catch (error) {
      this.watchSubscription = null;
    }
  }

  /**
   * Get the last known location
   */
  getLastKnownLocation() {
    return this.currentLocation;
  }
}

export default new LocationService();

