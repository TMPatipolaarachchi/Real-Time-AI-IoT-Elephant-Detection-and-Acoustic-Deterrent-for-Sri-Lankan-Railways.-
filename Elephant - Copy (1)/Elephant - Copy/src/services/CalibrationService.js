import { Accelerometer } from 'expo-sensors';
import locationService from './locationService';
import pillarService from './PillarService ';
import esp32Service from './esp32Service';

class CalibrationService {
  constructor() {
    this.isCalibrating = false;
    this.selectedPillarId = null;
    this.targetDistance = 1000; // meters
    this.currentDistance = 0;
    this.pillarPosition = null;
    this.waypoints = [];
    this.waypointNumber = 0; // Initialize waypoint counter
    this.accelerometerSubscription = null;
    this.listeners = [];
    
    // Real distance (accelerometer-based - actual path)
    this.realDistance = 0;
    this.lastTimestamp = null;
    this.baselineAccel = { x: 0, y: 0, z: 0 };
    this.lastAccel = { x: 0, y: 0, z: 0 }; // Previous reading for delta calculation
    this.isCalibrated = false;
    
    // GPS-based straight distance (for comparison only)
    this.straightDistance = 0;
    this.startLocation = null;
    this.lastLocation = null;
    
    // Walking parameters
    this.avgWalkingSpeed = 1.4; // m/s (typical walking speed)
    this.maxWalkingSpeed = 1.6; // m/s (normal to fast walking)
    
    // Velocity tracking (3D vector for x, y, z axes)
    this.velocity = { x: 0, y: 0, z: 0 };
    this.velocityHistory = { x: [], y: [], z: [] };
    this.maxHistorySize = 10;
    this.stationaryCount = 0;
    this.stationaryThreshold = 5; // frames
    this.movementThreshold = 0.2; // g threshold for detecting movement
  }

  /**
   * Add a listener for calibration updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    // Calculate velocity magnitude from 3 axes
    const velocityMagnitude = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
    
    const status = {
      isCalibrating: this.isCalibrating,
      currentDistance: this.realDistance,
      targetDistance: this.targetDistance,
      waypointsRecorded: this.waypoints.length,
      selectedPillarId: this.selectedPillarId,
      velocity: velocityMagnitude,
      realDistance: this.realDistance,
      straightDistance: this.straightDistance,
    };
    this.listeners.forEach((listener) => listener(status));
  }

  /**
   * Start calibration for a pillar
   * @param {string} pillarId - Pillar ID to calibrate for
   * @param {number} distance - Target distance in meters for each waypoint
   */
  async startCalibration(pillarId, distance = 1000) {
    if (this.isCalibrating) {
      throw new Error('Calibration already in progress');
    }

    // Check if accelerometer is available
    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Accelerometer not available on this device. Please use a physical device, not simulator.');
    }

    // Get pillar location
    const pillar = pillarService.getPillarById(pillarId);
    if (!pillar) {
      throw new Error('Pillar not found');
    }

    this.selectedPillarId = pillarId;
    this.targetDistance = distance;
    this.pillarPosition = { latitude: pillar.lat, longitude: pillar.lon };
    this.realDistance = 0;
    this.straightDistance = 0;
    this.waypoints = [];
    this.waypointNumber = 0; // Reset waypoint counter
    this.velocity = { x: 0, y: 0, z: 0 }; // 3D velocity vector
    this.velocityHistory = { x: [], y: [], z: [] }; // 3D history
    this.stationaryCount = 0;
    this.lastTimestamp = null;
    this.isCalibrated = false;

    // Check location permission
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission required');
    }

    // Get starting GPS location (for straight distance calculation only)
    this.startLocation = await locationService.getCurrentLocation();
    this.lastLocation = this.startLocation;
    
    // Calibrate accelerometer baseline
    await this.calibrateBaseline();

    this.isCalibrating = true;

    // Start accelerometer for real distance calculation
    Accelerometer.setUpdateInterval(50); // 50ms for smooth tracking
    this.accelerometerSubscription = Accelerometer.addListener((data) => {
      if (this.isCalibrating) {
        this.processAccelerometer(data);
      }
    });
    
    // Update GPS location periodically for straight distance
    this.startGPSTracking();

    this.notifyListeners();
  }

  /**
   * Calibrate baseline accelerometer reading (remove gravity)
   */
  async calibrateBaseline() {
    return new Promise((resolve, reject) => {
      let samples = [];
      const sampleCount = 50;
      let timeoutId;
      
      const subscription = Accelerometer.addListener((data) => {
        samples.push({ x: data.x, y: data.y, z: data.z });
        
        if (samples.length >= sampleCount) {
          clearTimeout(timeoutId);
          subscription.remove();
          
          // Calculate average (this includes gravity)
          this.baselineAccel = {
            x: samples.reduce((sum, s) => sum + s.x, 0) / sampleCount,
            y: samples.reduce((sum, s) => sum + s.y, 0) / sampleCount,
            z: samples.reduce((sum, s) => sum + s.z, 0) / sampleCount,
          };
          
          const magnitude = Math.sqrt(
            this.baselineAccel.x ** 2 + 
            this.baselineAccel.y ** 2 + 
            this.baselineAccel.z ** 2
          );
          
          this.isCalibrated = true;
          this.lastTimestamp = Date.now(); // Initialize timestamp
          resolve();
        }
      });
      
      Accelerometer.setUpdateInterval(20);
      
      // Timeout after 5 seconds
      timeoutId = setTimeout(() => {
        subscription.remove();
        reject(new Error('Baseline calibration timeout. Make sure accelerometer is working.'));
      }, 5000);
    });
  }

  /**
   * Start GPS tracking for straight distance calculation (comparison only)
   */
  startGPSTracking() {
    locationService.watchLocation((location) => {
      if (!location || !this.isCalibrating || !this.startLocation) return;
      
      // Calculate straight-line distance from start
      this.straightDistance = this.calculateHaversineDistance(
        this.startLocation.latitude,
        this.startLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      this.lastLocation = location;
      this.notifyListeners();
    }, 3000); // Update every 3 seconds
  }

  /**
   * Process accelerometer data to calculate REAL distance (actual path walked)
   */
  processAccelerometer(data) {
    const now = Date.now();
    
    if (!this.lastTimestamp) {
      this.lastTimestamp = now;
      return;
    }

    const dt = (now - this.lastTimestamp) / 1000; // seconds
    
    // Skip if time jump is too large (app paused)
    if (dt > 0.5 || dt < 0.01) {
      this.lastTimestamp = now;
      return;
    }
    
    // Calculate acceleration CHANGE (jerk/delta) from previous reading
    // This detects the periodic stepping motion better than absolute acceleration
    const deltaX = Math.abs(data.x - this.lastAccel.x);
    const deltaY = Math.abs(data.y - this.lastAccel.y);
    const deltaZ = Math.abs(data.z - this.lastAccel.z);
    
    // Also remove gravity baseline for absolute acceleration
    const accelX = Math.abs(data.x - this.baselineAccel.x);
    const accelY = Math.abs(data.y - this.baselineAccel.y);
    const accelZ = Math.abs(data.z - this.baselineAccel.z);
    
    // Lower threshold for delta (change) detection - walking creates small periodic changes
    const deltaThreshold = 0.03; // Very sensitive to acceleration changes
    const absThreshold = 0.05; // Threshold for absolute acceleration after baseline removal
    
    // Movement detected if EITHER delta OR absolute acceleration exceeds threshold
    const isMovingX = (deltaX > deltaThreshold) || (accelX > absThreshold);
    const isMovingY = (deltaY > deltaThreshold) || (accelY > absThreshold);
    const isMovingZ = (deltaZ > deltaThreshold) || (accelZ > absThreshold);
    const isMoving = isMovingX || isMovingY || isMovingZ;
    
    // Store current reading for next delta calculation
    this.lastAccel.x = data.x;
    this.lastAccel.y = data.y;
    this.lastAccel.z = data.z;
    
    // Detect if moving in ANY direction
    if (isMoving) {
      // Reset stationary counter
      this.stationaryCount = 0;
      
      // Process each axis separately
      const axes = ['x', 'y', 'z'];
      const accelComponents = { x: accelX, y: accelY, z: accelZ };
      const deltaComponents = { x: deltaX, y: deltaY, z: deltaZ };
      const axisThreshold = 0.02; // Very low threshold since we're using delta
      
      axes.forEach(axis => {
        const accel = accelComponents[axis];
        const delta = deltaComponents[axis];
        
        // Use BOTH delta and absolute acceleration for better detection
        // Delta catches periodic stepping, absolute catches sustained movement
        const combinedSignal = Math.max(delta * 1.2, accel); // Reduced weighting
        
        // Map to estimated velocity - REDUCED by ~50% to fix 2x speed issue
        let estimatedVelocity = 0;
        
        if (combinedSignal > axisThreshold) {
          if (combinedSignal < 0.08) {
            estimatedVelocity = 0.25; // Slow movement
          } else if (combinedSignal < 0.15) {
            estimatedVelocity = 0.4; // Normal walking
          } else if (combinedSignal < 0.3) {
            estimatedVelocity = 0.55; // Fast walking
          } else {
            estimatedVelocity = 0.7; // Very fast/running
          }
        }
        
        // Use exponential moving average to smooth velocity
        const alpha = 0.4; // Increased for faster response
        this.velocity[axis] = alpha * estimatedVelocity + (1 - alpha) * this.velocity[axis];
        
        // Store in history
        this.velocityHistory[axis].push(this.velocity[axis]);
        if (this.velocityHistory[axis].length > this.maxHistorySize) {
          this.velocityHistory[axis].shift();
        }
      });
      
      // Calculate smoothed velocity for each axis
      const smoothedVelocity = {
        x: this.velocityHistory.x.length > 0 ? 
           this.velocityHistory.x.reduce((sum, v) => sum + v, 0) / this.velocityHistory.x.length : 0,
        y: this.velocityHistory.y.length > 0 ? 
           this.velocityHistory.y.reduce((sum, v) => sum + v, 0) / this.velocityHistory.y.length : 0,
        z: this.velocityHistory.z.length > 0 ? 
           this.velocityHistory.z.reduce((sum, v) => sum + v, 0) / this.velocityHistory.z.length : 0
      };
      
      // Calculate total velocity magnitude from all 3 axes
      const totalVelocity = Math.sqrt(
        smoothedVelocity.x * smoothedVelocity.x +
        smoothedVelocity.y * smoothedVelocity.y +
        smoothedVelocity.z * smoothedVelocity.z
      );
      
      // Clamp to realistic walking speed
      const clampedVelocity = Math.min(totalVelocity, this.maxWalkingSpeed);
      
      // Calculate distance: d = v × t
      const distanceIncrement = clampedVelocity * dt;
      
      // Only add positive distance
      if (distanceIncrement > 0 && distanceIncrement < 0.5) { // Increased max per frame
        this.realDistance += distanceIncrement;
        
        // Check if target distance reached
        if (this.realDistance >= this.targetDistance) {
          this.recordWaypoint();
          this.realDistance = 0; // Reset for next waypoint
        }
        
        this.notifyListeners();
      }
    } else {
      // Stationary or very low movement
      this.stationaryCount++;
      
      // Zero-velocity update (ZUPT): reset velocity when stationary
      if (this.stationaryCount >= this.stationaryThreshold) {
        // Decay all axis velocities
        this.velocity.x *= 0.3;
        this.velocity.y *= 0.3;
        this.velocity.z *= 0.3;
        
        // Reset if all velocities are very low
        const totalVel = Math.sqrt(
          this.velocity.x * this.velocity.x +
          this.velocity.y * this.velocity.y +
          this.velocity.z * this.velocity.z
        );
        
        if (totalVel < 0.1) {
          this.velocity = { x: 0, y: 0, z: 0 };
          this.velocityHistory = { x: [], y: [], z: [] };
        }
      }
    }
    
    this.lastTimestamp = now;
  }

  /**
   * Record a waypoint when target distance is reached
   */
  async recordWaypoint() {
    try {
      // Increment waypoint number
      this.waypointNumber++;
      
      // Get current GPS location for waypoint coordinates
      const location = await locationService.getCurrentLocation();
      
      if (!location) {
        return;
      }

      // Calculate distance from pillar
      const distanceFromPillar = this.calculateHaversineDistance(
        this.pillarPosition.latitude,
        this.pillarPosition.longitude,
        location.latitude,
        location.longitude
      );

      const waypoint = {
        number: this.waypointNumber,
        realDistance: this.realDistance.toFixed(2), // Actual path walked
        straightDistance: this.straightDistance.toFixed(2), // Direct line distance
        latitude: location.latitude,
        longitude: location.longitude,
        distanceFromPillar: distanceFromPillar,
        pillarId: this.selectedPillarId,
        timestamp: new Date().toISOString(),
        description: `Waypoint ${this.waypointNumber} (${String.fromCharCode(64 + this.waypointNumber)})`,
      };

      this.waypoints.push(waypoint);

      // Save to ESP32
      const ip = await pillarService.getESP32IP();
      await esp32Service.addWaypoint(
        ip,
        this.selectedPillarId,
        location.latitude,
        location.longitude,
        distanceFromPillar,
        waypoint.description
      );
      
      // Update current pillar letter
      this.currentPillar = String.fromCharCode(65 + this.waypointNumber); // B, C, D, etc.
      
    } catch (error) {
    }

    this.notifyListeners();
  }

  /**
   * Stop calibration
   */
  stopCalibration() {
    this.isCalibrating = false;

    // Stop accelerometer
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    // Stop GPS tracking
    locationService.stopWatching();

    const recordedCount = this.waypoints.length;
    this.notifyListeners();
    
    return { waypointsRecorded: recordedCount, waypoints: this.waypoints };
  }

  /**
   * Get calibration status
   */
  getStatus() {
    // Calculate velocity magnitude from 3 axes
    const velocityMagnitude = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
    
    return {
      isCalibrating: this.isCalibrating,
      realDistance: this.realDistance, // Actual path walked (accelerometer)
      straightDistance: this.straightDistance, // Direct line (GPS)
      targetDistance: this.targetDistance,
      velocity: velocityMagnitude,
      waypointsRecorded: this.waypoints.length,
      selectedPillarId: this.selectedPillarId,
      progress: this.targetDistance > 0 ? (this.realDistance / this.targetDistance) * 100 : 0,
      isCalibrated: this.isCalibrated,
    };
  }

  /**
   * Check if calibration is currently active
   */
  isCalibrationActive() {
    return this.isCalibrating;
  }

  /**
   * Get recorded waypoints
   */
  getWaypoints() {
    return this.waypoints;
  }

  /**
   * Calculate distance using Haversine formula
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Check if currently calibrating
   */
  isActive() {
    return this.isCalibrating;
  }
}

export default new CalibrationService();