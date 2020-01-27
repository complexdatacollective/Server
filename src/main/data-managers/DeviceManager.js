const path = require('path');

const DeviceDB = require('./DeviceDB');

class DeviceManager {
  constructor(dataDir) {
    const dbFile = path.join(dataDir, 'db', 'devices.db');
    this.db = new DeviceDB(dbFile);
  }

  exists(deviceId) {
    return this.db.get(deviceId).then(Boolean);
  }

  // TODO: see notes in cipher.js; may want to persist derivation config per-device.
  // TODO: Validate format/lengths. Require arg names for clarity?
  createDeviceDocument(secretHex, deviceName) {
    if (!secretHex) {
      return Promise.reject(new Error('Invalid input'));
    }
    return this.db.createWithSecretAndName(secretHex, deviceName);
  }

  fetchDeviceList() {
    return this.db.all();
  }

  destroyAllDevices() {
    return this.db.destroyAll();
  }

  destroy(deviceId) {
    return this.db.destroy(deviceId);
  }
}

module.exports = DeviceManager;
