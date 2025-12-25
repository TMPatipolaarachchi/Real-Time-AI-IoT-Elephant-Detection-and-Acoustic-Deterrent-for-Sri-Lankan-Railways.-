import AsyncStorage from '@react-native-async-storage/async-storage';
import esp32Service from './esp32Service';

const PILLARS_KEY = 'pillars_data';
const ESP32_IP_KEY = 'esp32_ip';

class PillarService {
  constructor() {
    this.pillars = [];
    this.esp32Ip = null;
    this.listeners = [];
  }

  /**
   * Add a listener for pillar updates
   * @param {function} callback - Callback function to receive updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of pillar updates
   */
  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.pillars));
  }

  /**
   * Get ESP32 IP address
   */
  async getESP32IP() {
    if (!this.esp32Ip) {
      const stored = await AsyncStorage.getItem(ESP32_IP_KEY);
      this.esp32Ip = stored || '192.168.4.1'; // Default IP (ESP32 AP mode)
    }
    return this.esp32Ip;
  }

  /**
   * Set ESP32 IP address
   * @param {string} ip - ESP32 IP address
   */
  async setESP32IP(ip) {
    this.esp32Ip = ip;
    await AsyncStorage.setItem(ESP32_IP_KEY, ip);
  }

  /**
   * Fetch pillars from ESP32
   * @returns {Promise<array>} Array of pillars
   */
  async fetchPillars() {
    try {
      const ip = await this.getESP32IP();
      const response = await esp32Service.getPillars(ip);
      
      if (response.status === 'success') {
        this.pillars = response.pillars;
        await this.storePillars(this.pillars);
        this.notifyListeners();
        return this.pillars;
      }
      
      throw new Error('Failed to fetch pillars');
    } catch (error) {
      // Load from local storage if fetch fails
      return await this.loadStoredPillars();
    }
  }

  /**
   * Store pillars locally
   * @param {array} pillars - Array of pillars
   */
  async storePillars(pillars) {
    try {
      await AsyncStorage.setItem(PILLARS_KEY, JSON.stringify(pillars));
    } catch (error) {
    }
  }

  /**
   * Load pillars from local storage
   */
  async loadStoredPillars() {
    try {
      const data = await AsyncStorage.getItem(PILLARS_KEY);
      if (data) {
        this.pillars = JSON.parse(data);
        this.notifyListeners();
        return this.pillars;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all pillars (from cache or storage)
   */
  async getPillars() {
    if (this.pillars.length > 0) {
      return this.pillars;
    }
    return await this.loadStoredPillars();
  }

  /**
   * Get pillar by ID
   * @param {string} id - Pillar ID
   */
  getPillarById(id) {
    return this.pillars.find(p => p.id === id);
  }

  /**
   * Calculate distances from train location to all pillars
   * @param {number} trainLat - Train latitude
   * @param {number} trainLon - Train longitude
   * @returns {Promise<object>} GPS response with distances
   */
  async calculateDistances(trainLat, trainLon) {
    try {
      const ip = await this.getESP32IP();
      const response = await esp32Service.sendGPS(ip, trainLat, trainLon);
      return response;
    } catch (error) {
      // Don't log "no pillars" error - it's expected
      if (!error.message.includes('No pillars found')) {
      }
      throw error;
    }
  }

  /**
   * Get nearest pillar info
   * @param {number} trainLat - Train latitude
   * @param {number} trainLon - Train longitude
   * @returns {Promise<object>} Nearest pillar with distances
   */
  async getNearestPillar(trainLat, trainLon) {
    try {
      const response = await this.calculateDistances(trainLat, trainLon);
      if (response.status === 'success' && response.nearestPillar) {
        return response.nearestPillar;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check ESP32 connection status
   */
  async checkConnection() {
    try {
      const ip = await this.getESP32IP();
      const status = await esp32Service.getStatus(ip);
      return status;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all pillars and waypoints from ESP32
   */
  async clearAll() {
    try {
      const ip = await this.getESP32IP();
      const response = await esp32Service.clearAll(ip);
      
      if (response.status === 'success') {
        this.pillars = [];
        await this.storePillars([]);
        this.notifyListeners();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a single pillar
   * @param {string} name - Pillar name
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   */
  async addPillar(name, lat, lon) {
    try {
      const ip = await this.getESP32IP();
      const response = await esp32Service.addPillar(ip, name, lat, lon);
      
      if (response.status === 'success') {
        await this.fetchPillars();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a pillar
   * @param {string} pillarId - Pillar ID
   */
  async deletePillar(pillarId) {
    try {
      const ip = await this.getESP32IP();
      const response = await esp32Service.deletePillar(ip, pillarId);
      
      if (response.status === 'success') {
        await this.fetchPillars();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new PillarService();
