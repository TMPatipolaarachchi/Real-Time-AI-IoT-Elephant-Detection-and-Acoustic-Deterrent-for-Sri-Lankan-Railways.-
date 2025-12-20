import esp32Service from './esp32Service';

const DEFAULT_COORDS = {
  latitude: 6.9210,    // ~500m north
  longitude: 79.9730   // slightly west
};

// const DEFAULT_COORDS = { 
//   latitude: 6.9681, 
//   longitude: 79.9487 
// };

class ESP32TestService {
  constructor() {
    this.intervalId = null;
    this.currentScenario = null;
    this.scenarioStep = 0;
    this.isRunning = false;
    this.data = this.getDefaultData();
  }

  scenarios = {
    elephant_detection: [
      { elephantDetected: true, elephantLocation: DEFAULT_COORDS, riskLevel: 'medium', elephantLeft: false}
    ],
   
  };

  getDefaultData() {
    return {
      elephantDetected: false,
      elephantLocation: null,
      riskLevel: 'low',
      elephantLeft: false,
      timestamp: new Date().toISOString(),
    };
  }

  buildPayload(partial = {}) {
    return {
      elephantDetected: false,
      elephantLocation: null,
      riskLevel: 'low',
      elephantLeft: false,
      ...partial,
      timestamp: new Date().toISOString(),
    };
  }

  sendData(partial) {
    const payload = this.buildPayload(partial);
    this.data = payload;
    try {
      esp32Service.processData(payload);
      console.log('[ESP32TestService] Sent data:', payload);
    } catch (error) {
      console.error('[ESP32TestService] Error sending data:', error);
    }
  }

  startScenario(scenarioName, interval = 5000, loop = false) {
    const scenario = this.scenarios[scenarioName];
    if (!scenario || scenario.length === 0) {
      console.error(`[ESP32TestService] Scenario "${scenarioName}" not found`);
      return;
    }

    this.stop();
    this.currentScenario = scenarioName;
    this.scenarioStep = 0;
    this.isRunning = true;

    const runStep = () => {
      if (!this.isRunning) return;

      if (this.scenarioStep >= scenario.length) {
        if (loop) {
          this.scenarioStep = 0;
        } else {
          console.log(`[ESP32TestService] Scenario "${scenarioName}" completed`);
          this.stop();
          return;
        }
      }

      const step = scenario[this.scenarioStep];
      this.sendData(step);
      this.scenarioStep += 1;
    };

    runStep();
    this.intervalId = setInterval(runStep, interval);
  }

  startRandom(interval = 10000) {
    const situations = ['detection', 'departure', 'high_risk', 'medium_risk', 'low_risk'];
    this.stop();
    this.isRunning = true;

    const generateRandom = () => {
      if (!this.isRunning) return;
      const situation = situations[Math.floor(Math.random() * situations.length)];
      this.sendSituation(situation);
    };

    generateRandom();
    this.intervalId = setInterval(generateRandom, interval);
  }

  sendSituation(situation, options = {}) {
    const { latitude = DEFAULT_COORDS.latitude, longitude = DEFAULT_COORDS.longitude } = options;
    const situations = {
      detection: { elephantDetected: true, elephantLocation: { latitude, longitude }, elephantLeft: false, riskLevel: 'low' },
      departure: { elephantDetected: false, elephantLocation: null, elephantLeft: true, riskLevel: 'low' },
      high_risk: { elephantDetected: true, elephantLocation: { latitude, longitude }, elephantLeft: false, riskLevel: 'high' },
      medium_risk: { elephantDetected: true, elephantLocation: { latitude, longitude }, elephantLeft: false, riskLevel: 'medium' },
      low_risk: { elephantDetected: true, elephantLocation: { latitude, longitude }, elephantLeft: false, riskLevel: 'low' },
    };

    const payload = situations[situation];
    if (!payload) {
      console.error(`[ESP32TestService] Situation "${situation}" not found`);
      return;
    }

    this.sendData(payload);
  }

  sendTestData(data) {
    this.sendData(data);
  }

  push() {
    this.sendData(this.data);
  }

  reset() {
    this.sendData(this.getDefaultData());
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.currentScenario = null;
    this.scenarioStep = 0;
  }

  isTestRunning() {
    return this.isRunning;
  }

  getCurrentScenario() {
    return this.currentScenario;
  }

  getData() {
    return this.data;
  }
}

export default new ESP32TestService();
