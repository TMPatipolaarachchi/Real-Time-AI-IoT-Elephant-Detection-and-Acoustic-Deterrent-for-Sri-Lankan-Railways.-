import { calculateDistance } from '../utils/haversine';
import locationService from './locationService';
import esp32Service from './esp32Service';

class DistanceService {
  constructor() {
    this.distance = null;
    this.elephantLocation = null;
    this.trainLocation = null;
    this.calculationInterval = null;
    this.listeners = [];
    this.isActive = false;
  }

  /**
   * Add a listener for distance updates
   * @param {function} callback - Callback function to receive updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of distance update
   */
  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.distance, this.trainLocation, this.elephantLocation));
  }

  /**
   * Start distance calculation
   * @param {object} elephantLocation - Elephant GPS coordinates {latitude, longitude}
   */
  startCalculation(elephantLocation) {
    if (!elephantLocation || !elephantLocation.latitude || !elephantLocation.longitude) {
      console.error('Invalid elephant location provided');
      return;
    }

    this.elephantLocation = elephantLocation;
    this.isActive = true;

    // Get initial location
    locationService.getCurrentLocation().then((location) => {
      if (location) {
        this.trainLocation = location;
        this.calculateDistance();
      }
    });

    // Watch location changes and calculate distance every 5 seconds
    locationService.watchLocation((location) => {
      if (location) {
        this.trainLocation = location;
        this.calculateDistance();
      }
    }, 5000);

    // Also calculate on interval to ensure updates every 5 seconds
    this.calculationInterval = setInterval(() => {
      if (this.isActive && this.trainLocation && this.elephantLocation) {
        this.calculateDistance();
      }
    }, 5000);
  }

  /**
   * Calculate distance using Haversine formula
   */
  calculateDistance() {
    if (!this.trainLocation || !this.elephantLocation) {
      return;
    }

    const distance = calculateDistance(
      this.trainLocation.latitude,
      this.trainLocation.longitude,
      this.elephantLocation.latitude,
      this.elephantLocation.longitude
    );

    this.distance = distance;
    this.notifyListeners();

    // Stop calculation when distance reaches 0 (or very close to 0 - 0.1 meters)
    // But keep the distance and location data for display
    if (distance <= 0.0001) {
      this.isActive = false;
      locationService.stopWatching();
      if (this.calculationInterval) {
        clearInterval(this.calculationInterval);
        this.calculationInterval = null;
      }
      // Keep distance and location data for display (don't clear them)
      this.notifyListeners();
    }
  }

  /**
   * Stop distance calculation
   * @param {boolean} clearData - Whether to clear distance and location data (default: false)
   */
  stopCalculation(clearData = false) {
    this.isActive = false;
    locationService.stopWatching();
    if (this.calculationInterval) {
      clearInterval(this.calculationInterval);
      this.calculationInterval = null;
    }
    // Only clear data if explicitly requested (e.g., when elephant leaves)
    if (clearData) {
      this.distance = null;
      this.elephantLocation = null;
    }
    this.notifyListeners();
  }

  /**
   * Get current distance
   */
  getCurrentDistance() {
    return this.distance;
  }

  /**
   * Check if calculation is active
   */
  isCalculationActive() {
    return this.isActive;
  }
}

export default new DistanceService();

