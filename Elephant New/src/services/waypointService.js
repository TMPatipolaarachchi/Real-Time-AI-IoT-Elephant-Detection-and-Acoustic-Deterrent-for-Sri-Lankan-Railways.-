import AsyncStorage from '@react-native-async-storage/async-storage';
import esp32Service from './esp32Service';
import pillarService from './pillarService';

const WAYPOINTS_KEY = 'waypoints_data';

class WaypointService {
  constructor() {
    this.waypoints = [];
    this.listeners = [];
  }

  /**
   * Add a listener for waypoint updates
   * @param {function} callback - Callback function to receive updates
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of waypoint updates
   */
  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.waypoints));
  }

  /**
   * Fetch waypoints from ESP32
   * @returns {Promise<array>} Array of waypoints
   */
  async fetchWaypoints() {
    try {
      const ip = await pillarService.getESP32IP();
      const response = await esp32Service.getWaypoints(ip);
      
      if (response.status === 'success') {
        this.waypoints = response.waypoints;
        await this.storeWaypoints(this.waypoints);
        this.notifyListeners();
        return this.waypoints;
      }
      
      throw new Error('Failed to fetch waypoints');
    } catch (error) {
      // Load from local storage if fetch fails
      return await this.loadStoredWaypoints();
    }
  }

  /**
   * Store waypoints locally
   * @param {array} waypoints - Array of waypoints
   */
  async storeWaypoints(waypoints) {
    try {
      await AsyncStorage.setItem(WAYPOINTS_KEY, JSON.stringify(waypoints));
    } catch (error) {
    }
  }

  /**
   * Load waypoints from local storage
   */
  async loadStoredWaypoints() {
    try {
      const data = await AsyncStorage.getItem(WAYPOINTS_KEY);
      if (data) {
        this.waypoints = JSON.parse(data);
        this.notifyListeners();
        return this.waypoints;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all waypoints (from cache or storage)
   */
  async getWaypoints() {
    if (this.waypoints.length > 0) {
      return this.waypoints;
    }
    return await this.loadStoredWaypoints();
  }

  /**
   * Get waypoints for a specific pillar
   * @param {string} pillarId - Pillar ID
   */
  getWaypointsByPillar(pillarId) {
    return this.waypoints.filter(w => w.pillarId === pillarId);
  }

  /**
   * Bulk import data to ESP32
   * @param {array} data - Array of data rows
   * Format: {index, trackPathId, latitude, longitude, pillerName, front, frontTotal, back, backTotal}
   * @returns {Promise<object>} Import result
   */
  async bulkImport(data) {
    try {
      const ip = await pillarService.getESP32IP();
      const response = await esp32Service.bulkImport(ip, data);
      
      if (response.status === 'success') {
        // Refresh pillars and waypoints after import
        await pillarService.fetchPillars();
        await this.fetchWaypoints();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse CSV/spreadsheet data for bulk import
   * @param {string} csvText - CSV text content
   * @returns {array} Parsed data array
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length >= 4) {
        const row = {
          index: parseInt(parts[0]) || 0,
          trackPathId: parseInt(parts[1]) || 1,
          latitude: parseFloat(parts[2]),
          longitude: parseFloat(parts[3]),
          pillerName: parts[4] || '',
          front: parts[5] ? parseInt(parts[5]) : -1,
          frontTotal: parts[6] ? parseInt(parts[6]) : 0,
          back: parts[7] ? parseInt(parts[7]) : -1,
          backTotal: parts[8] ? parseInt(parts[8]) : 0,
        };
        
        data.push(row);
      }
    }
    
    return data;
  }

  /**
   * Parse spreadsheet-style data (tab or comma separated)
   * @param {string} text - Text content
   * @returns {array} Parsed data array
   */
  parseSpreadsheet(text) {
    const lines = text.trim().split('\n');
    const data = [];
    
    // Detect separator (tab or comma)
    const separator = lines[0].includes('\t') ? '\t' : ',';
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(separator).map(p => p.trim());
      
      if (parts.length >= 4) {
        const row = {
          index: parseInt(parts[0]) || 0,
          trackPathId: parseInt(parts[1]) || 1,
          latitude: parseFloat(parts[2]),
          longitude: parseFloat(parts[3]),
          pillerName: parts[4] || '',
          front: parts[5] ? parseInt(parts[5]) : -1,
          frontTotal: parts[6] ? parseInt(parts[6]) : 0,
          back: parts[7] ? parseInt(parts[7]) : -1,
          backTotal: parts[8] ? parseInt(parts[8]) : 0,
        };
        
        data.push(row);
      }
    }
    
    return data;
  }

  /**
   * Create sample data for testing
   * @returns {array} Sample data array
   */
  createSampleData() {
    return [
      {
        index: 1,
        trackPathId: 1,
        latitude: 6.9271,
        longitude: 79.8612,
        pillerName: 'Pillar A',
        front: -1,
        frontTotal: 0,
        back: -1,
        backTotal: 0,
      },
      {
        index: 2,
        trackPathId: 1,
        latitude: 6.9275,
        longitude: 79.8615,
        pillerName: '',
        front: 500,
        frontTotal: 500,
        back: -1,
        backTotal: 0,
      },
      {
        index: 3,
        trackPathId: 1,
        latitude: 6.9280,
        longitude: 79.8620,
        pillerName: 'Pillar B',
        front: -1,
        frontTotal: 0,
        back: -1,
        backTotal: 0,
      },
      {
        index: 4,
        trackPathId: 1,
        latitude: 6.9285,
        longitude: 79.8625,
        pillerName: '',
        front: -1,
        frontTotal: 0,
        back: 300,
        backTotal: 300,
      },
    ];
  }

  /**
   * Delete a waypoint
   * @param {number} waypointId - Waypoint ID
   */
  async deleteWaypoint(waypointId) {
    try {
      const ip = await pillarService.getESP32IP();
      const response = await esp32Service.deleteWaypoint(ip, waypointId);
      
      if (response.status === 'success') {
        await this.fetchWaypoints();
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new WaypointService();
