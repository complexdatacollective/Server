/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const path = require('path');
const NeDB = require('nedb');
const uuidv4 = require('uuid/v4');

const DeviceDbName = 'devices.db';

const withDefaultName = dbDevice => ({
  name: `Device ${dbDevice._id.substr(0, 6)}`,
  ...dbDevice,
});

class DeviceManager {
  // nedb doesn't support multiple 'concurrent' clients.
  // Even though existing app code is serial, autoloading happens async
  // and nedb errors when renaming an expected temp file.
  // Temporary workaround, since we're running worker services in the same process:
  // cache client per name.
  static dbClient(filename) {
    if (!DeviceManager.dbClients) {
      DeviceManager.dbClients = {};
    }
    if (!DeviceManager.dbClients[filename]) {
      // eslint-disable-next-line new-cap
      DeviceManager.dbClients[filename] = new NeDB({
        corruptAlertThreshold: 0,
        inMemoryOnly: false,
        filename,
        autoload: true,
        timestampData: true,
      });
    }
    return DeviceManager.dbClients[filename];
  }

  constructor(dataDir, dbName = DeviceDbName) {
    const dbFile = path.join(dataDir, 'db', dbName);
    this.db = DeviceManager.dbClient(dbFile);
  }

  // TODO: see notes in cipher.js; may want to persist derivation config per-device.
  // TODO: Validate format/lengths. Require arg names for clarity?
  createDeviceDocument(secretHex, deviceName) {
    return new Promise((resolve, reject) => {
      if (!secretHex) {
        reject(new Error('Invalid input'));
        return;
      }
      this.db.insert({
        secretKey: secretHex,
        name: deviceName,
        _id: uuidv4(),
      }, (err, doc) => {
        if (err || !doc) {
          reject(err || new Error('Insert failed'));
        } else {
          resolve(doc);
        }
      });
    });
  }

  fetchDeviceList() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs.map(withDefaultName));
        }
      });
    });
  }
}

module.exports = DeviceManager;
