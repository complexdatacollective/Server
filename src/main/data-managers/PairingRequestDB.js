const logger = require('electron-log');
const DatabaseAdapter = require('./DatabaseAdapter');

const dbConfig = {
  // Note: with in-memory, closing the app will cancel the pairing process.
  inMemoryOnly: true,
};

const DeviceRequestTTLSeconds = 5 * 60;

class PairingRequestDB extends DatabaseAdapter {
  constructor(dbName, additionalConfig = {}) {
    super(dbName, { ...dbConfig, ...additionalConfig });

    this.db.ensureIndex({
      fieldName: 'createdAt',
      expireAfterSeconds: DeviceRequestTTLSeconds,
    }, (err) => {
      if (err) { logger.error(err); }
    });

    Object.defineProperty(this,
      'deviceRequestTTLSeconds',
      { configurable: false, writable: false, value: DeviceRequestTTLSeconds });
  }
}

module.exports = PairingRequestDB;
