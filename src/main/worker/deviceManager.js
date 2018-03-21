const path = require('path');
const nedb = require('nedb');
const uuidv4 = require('uuid/v4');

const DeviceDbName = 'devices.db';

class DeviceManager {
  // TODO: nedb doesn't (yet?) support multiple 'concurrent' clients
  // Even though existing app code is serial, autoloading happens async,
  // and nedb errors when renaming an expected temp file.
  // Temporary workaround, since we're running worker services in the same process:
  // cache client per name.
  static dbClient(filename) {
    if (!DeviceManager.dbClients) {
      DeviceManager.dbClients = {};
    }
    if (!DeviceManager.dbClients[filename]) {
      // eslint-disable-next-line new-cap
      DeviceManager.dbClients[filename] = new nedb({
        inMemoryOnly: false,
        filename,
        autoload: true,
        timestampData: true,
      });
    }
    return DeviceManager.dbClients[filename];
  }

  constructor(dataDir, dbName = DeviceDbName) {
    const dbFile = path.join(dataDir, dbName);
    this.db = DeviceManager.dbClient(dbFile);
  }

  // TODO: Validate format/lengths. Require arg names for clarity?
  createDeviceDocument(saltHex, secretHex) {
    return new Promise((resolve, reject) => {
      if (!saltHex || !secretHex) {
        reject(new Error('Invalid input'));
        return;
      }
      this.db.insert({
        salt: saltHex,
        secretKey: secretHex,
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
          resolve(docs);
        }
      });
    });
  }
}

module.exports = DeviceManager;