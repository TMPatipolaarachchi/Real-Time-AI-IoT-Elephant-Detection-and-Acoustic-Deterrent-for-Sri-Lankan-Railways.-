import AsyncStorage from '@react-native-async-storage/async-storage';

const ESP32_DATA_KEY = 'esp32_data';
const ESP32_ALERTS_KEY = 'esp32_alerts';

class ESP32Service {
  constructor() {
    this.listeners = [];
    this.simulationInterval = null;
  }

  /**
   * Add a listener for ESP32 data updates
   * @param {function} callback - Callback function to receive updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of new data
   * @param {object} data - ESP32 data
   */
  notifyListeners(data) {
    this.listeners.forEach((listener) => listener(data));
  }

  /**
   * Store ESP32 data locally (offline-first)
   * @param {object} data - ESP32 data
   */
  async storeData(data) {
    try {
      await AsyncStorage.setItem(ESP32_DATA_KEY, JSON.stringify(data));
      await this.addAlert(data);
    } catch (error) {
      console.error('Error storing ESP32 data:', error);
    }
  }

  /**
   * Get stored ESP32 data
   */
  async getStoredData() {
    try {
      const data = await AsyncStorage.getItem(ESP32_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting stored ESP32 data:', error);
      return null;
    }
  }

  /**
   * Add alert to history
   */
  async addAlert(data) {
    try {
      const alerts = await this.getAlerts();
      alerts.unshift({
        ...data,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 alerts
      const limitedAlerts = alerts.slice(0, 50);
      await AsyncStorage.setItem(ESP32_ALERTS_KEY, JSON.stringify(limitedAlerts));
    } catch (error) {
      console.error('Error adding alert:', error);
    }
  }

  /**
   * Get alert history
   */
  async getAlerts() {
    try {
      const alerts = await AsyncStorage.getItem(ESP32_ALERTS_KEY);
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Simulate ESP32 data reception (for testing)
   * In production, this would connect to actual ESP32 via WebSocket/HTTP
   * @param {boolean} enable - Enable/disable simulation
   */
  startSimulation(enable = false) {
    if (!enable) {
      console.log('ESP32 simulation disabled. Connect to actual ESP32 device.');
      return;
    }

    // Import simulator dynamically to avoid issues if not needed
    import('../utils/esp32Simulator').then(({ simulateESP32Data }) => {
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
      }
      
      this.simulationInterval = simulateESP32Data((data) => {
        this.processData(data);
      }, 15000); // Update every 15 seconds for testing
      
      console.log('ESP32 simulation started (for testing only)');
    }).catch((error) => {
      console.error('Error starting simulation:', error);
    });
  }

  /**
   * Connect to ESP32 test service for controlled testing
   * @param {string} scenario - Test scenario name (optional)
   * @param {object} options - Test options (optional)
   */
  connectToTestService(scenario = null, options = {}) {
    // Import test service dynamically
    import('./esp32TestService').then((esp32TestService) => {
      if (scenario) {
        esp32TestService.default.startScenario(scenario, options.interval || 5000, options.loop || false);
      } else {
        esp32TestService.default.startRandom(options.interval || 10000);
      }
      console.log('Connected to ESP32 test service');
    }).catch((error) => {
      console.error('Error connecting to test service:', error);
    });
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Process incoming ESP32 data
   * Expected format:
   * {
   *   elephantDetected: boolean,
   *   elephantLocation: { latitude: number, longitude: number },
   *   riskLevel: 'low' | 'medium' | 'high',
   *   elephantLeft: boolean
   * }
   */
  processData(data) {
    this.storeData(data);
    this.notifyListeners(data);
  }
}

export default new ESP32Service();

 