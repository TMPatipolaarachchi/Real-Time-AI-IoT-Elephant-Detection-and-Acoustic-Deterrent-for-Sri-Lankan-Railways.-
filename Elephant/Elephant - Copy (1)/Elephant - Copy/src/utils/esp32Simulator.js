/**
 * ESP32 Data Simulator
 * 
 * This utility simulates ESP32 data for testing purposes.
 * In production, replace this with actual ESP32 WebSocket/HTTP connection.
 * 
 * Usage:
 * import { simulateESP32Data } from '../utils/esp32Simulator';
 * import esp32Service from '../services/esp32Service';
 * 
 * // Start simulation
 * const interval = simulateESP32Data((data) => {
 *   esp32Service.processData(data);
 * });
 * 
 * // Stop simulation
 * clearInterval(interval);
 */

/**
 * Generate simulated ESP32 data
 * @param {function} callback - Callback function to receive simulated data
 * @param {number} interval - Update interval in milliseconds (default: 10000)
 * @returns {number} Interval ID that can be cleared
 */
export function simulateESP32Data(callback, interval = 10000) {
  let elephantDetected = false;
  let elephantLeft = false;
  let riskLevel = 'low';
  let detectionCount = 0;

  // Simulate elephant detection cycle
  const simulate = () => {
    detectionCount++;

    // Simulate detection pattern
    if (detectionCount % 3 === 0 && !elephantDetected) {
      // New elephant detected
      elephantDetected = true;
      elephantLeft = false;
      riskLevel = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      
      // Simulate elephant location (Sri Lanka coordinates)
      const elephantLocation = {
        latitude: 7.8731 + (Math.random() - 0.5) * 0.1, // Around Sri Lanka
        longitude: 80.7718 + (Math.random() - 0.5) * 0.1,
      };

      const data = {
        elephantDetected: true,
        elephantLocation,
        riskLevel,
        elephantLeft: false,
        timestamp: new Date().toISOString(),
      };

      callback(data);
    } else if (elephantDetected && detectionCount % 5 === 0) {
      // Elephant left
      elephantDetected = false;
      elephantLeft = true;
      riskLevel = 'low';

      const data = {
        elephantDetected: false,
        elephantLocation: null,
        riskLevel: 'low',
        elephantLeft: true,
        timestamp: new Date().toISOString(),
      };

      callback(data);
    } else if (elephantDetected && !elephantLeft) {
      // Update risk level while elephant is present
      const currentRisk = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      riskLevel = currentRisk;

      const data = {
        elephantDetected: true,
        elephantLocation: {
          latitude: 7.8731 + (Math.random() - 0.5) * 0.1,
          longitude: 80.7718 + (Math.random() - 0.5) * 0.1,
        },
        riskLevel,
        elephantLeft: false,
        timestamp: new Date().toISOString(),
      };

      callback(data);
    } else {
      // No elephant detected
      const data = {
        elephantDetected: false,
        elephantLocation: null,
        riskLevel: 'low',
        elephantLeft: false,
        timestamp: new Date().toISOString(),
      };

      callback(data);
    }
  };

  // Initial call
  simulate();

  // Set up interval
  return setInterval(simulate, interval);
}

/**
 * Generate a single simulated data point
 * @param {object} options - Configuration options
 * @returns {object} Simulated ESP32 data
 */
export function generateSimulatedData(options = {}) {
  const {
    elephantDetected = false,
    riskLevel = 'low',
    elephantLeft = false,
    baseLatitude = 7.8731,
    baseLongitude = 80.7718,
  } = options;

  return {
    elephantDetected,
    elephantLocation: elephantDetected
      ? {
          latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
          longitude: baseLongitude + (Math.random() - 0.5) * 0.1,
        }
      : null,
    riskLevel,
    elephantLeft,
    timestamp: new Date().toISOString(),
  };
}

