const path = require('path');

const DeviceDB = require('./DeviceDB');

class DeviceManager {
  constructor(dataDir) {
    const dbFile = path.join(dataDir, 'db', 'devices.db');
    this.db = new DeviceDB(dbFile);
  }

  // TODO: see notes in cipher.js; may want to persist derivation config per-device.
  // TODO: Validate format/lengths. Require arg names for clarity?
  createDeviceDocument(secretHex, deviceName) {
    if (!secretHex) {
      return Promise.reject(new Error('Invalid input'));
    }
    return this.db.create(secretHex, deviceName);
  }

  fetchDeviceList() {
    return this.db.all();
  }

  // TODO: Probably remove after alpha testing
  destroyAllDevices() {
    return this.db.destroyAll();
  }
}

module.exports = DeviceManager;
