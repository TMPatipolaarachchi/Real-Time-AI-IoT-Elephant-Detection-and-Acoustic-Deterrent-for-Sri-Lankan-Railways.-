import { calculateDistance } from '../utils/haversine';
import locationService from './locationService';
import esp32Service from './esp32Service';
import pillarService from './pillarService';
import calibrationService from './calibrationService';

class DistanceService {
  constructor() {
    this.distance = null;
    this.trackDistance = null;
    this.straightDistance = null;
    this.nearestPillar = null;
    this.allPillars = [];
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
   * Passes: distance, trainLocation, elephantLocation, nearestPillar, trackDistance, straightDistance, allPillars
   */
  notifyListeners() {
    this.listeners.forEach((listener) => 
      listener(
        this.distance, 
        this.trainLocation, 
        this.elephantLocation,
        this.nearestPillar,
        this.trackDistance,
        this.straightDistance,
        this.allPillars
      )
    );
  }

  /**
   * Start distance calculation
   * @param {object} elephantLocation - Elephant GPS coordinates {latitude, longitude}
   */
  startCalculation(elephantLocation) {
    if (!elephantLocation || !elephantLocation.latitude || !elephantLocation.longitude) {
      return;
    }

    this.elephantLocation = elephantLocation;
    this.isActive = true;

    // Get initial location
    locationService.getCurrentLocation().then((location) => {
      if (location) {
        this.trainLocation = location;
        this.calculateDistance();
        this.calculatePillarDistances();
      }
    });

    // Watch location changes and calculate distance every 5 seconds
    locationService.watchLocation((location) => {
      if (location) {
        this.trainLocation = location;
        this.calculateDistance();
        this.calculatePillarDistances();
      }
    }, 5000);

    // Also calculate on interval to ensure updates every 5 seconds
    this.calculationInterval = setInterval(() => {
      if (this.isActive && this.trainLocation) {
        if (this.elephantLocation) {
          this.calculateDistance();
        }
        this.calculatePillarDistances();
      }
    }, 5000);
  }

  /**
   * Calculate distance to elephant using Haversine formula
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
   * Calculate distances to pillars using ESP32 track path calculation
   */
  async calculatePillarDistances() {
    if (!this.trainLocation) {
      return;
    }

    // Skip if not actively tracking (no elephant detected)
    if (!this.isActive || !this.elephantLocation) {
      return;
    }

    // Skip if calibration is active
    if (calibrationService.isCalibrationActive()) {
      return;
    }

    // Skip if no pillars exist (prevents unnecessary GPS requests)
    const pillars = await pillarService.getPillars();
    if (!pillars || pillars.length === 0) {
      return;
    }

    try {
      const response = await pillarService.calculateDistances(
        this.trainLocation.latitude,
        this.trainLocation.longitude
      );

      if (response.status === 'success') {
        this.nearestPillar = response.nearestPillar;
        this.trackDistance = response.nearestPillar?.trackDistance;
        this.straightDistance = response.nearestPillar?.straightDistance;
        this.allPillars = response.allPillars || [];
        
        // Process ESP32 response data for dashboard
        if (response.elephantDetected && response.distance) {
          // Create esp32Data object with the distance info
          const esp32Data = {
            elephantDetected: response.elephantDetected,
            elephantLocation: response.elephantLocation,
            distance: response.distance,
            status: response.status
          };
          
          // Notify ESP32 service to update listeners with distance data
          esp32Service.processData(esp32Data);
        } else if (response.elephantDetected === false) {
          // No elephant detected - send clear signal
          const esp32Data = {
            elephantDetected: false,
            elephantLeft: true,
            message: response.message || "No elephant detected",
            status: response.status
          };
          
          // Notify ESP32 service to clear elephant data
          esp32Service.processData(esp32Data);
        }
        
        this.notifyListeners();
      }
    } catch (error) {
      // Silently handle "no pillars" error - it's expected when pillars haven't been added yet
      if (error.message && error.message.includes('No pillars found')) {
        // Don't log this error - it's normal when no pillars exist
        return;
      }
      // Continue with basic elephant distance calculation even if pillar calc fails
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
      this.trackDistance = null;
      this.straightDistance = null;
      this.nearestPillar = null;
      this.allPillars = [];
    }
    this.notifyListeners();
  }

  /**
   * Get current distance to elephant
   */
  getCurrentDistance() {
    return this.distance;
  }

  /**
   * Get track distance to nearest pillar
   */
  getTrackDistance() {
    return this.trackDistance;
  }

  /**
   * Get straight-line distance to nearest pillar
   */
  getStraightDistance() {
    return this.straightDistance;
  }

  /**
   * Get nearest pillar information
   */
  getNearestPillar() {
    return this.nearestPillar;
  }

  /**
   * Get all pillars with distances
   */
  getAllPillars() {
    return this.allPillars;
  }

  /**
   * Check if calculation is active
   */
  isCalculationActive() {
    return this.isActive;
  }
}

export default new DistanceService();

