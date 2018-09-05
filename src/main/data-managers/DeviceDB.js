/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const uuidv4 = require('uuid/v4');

const DatabaseAdapter = require('./DatabaseAdapter');

const withDefaultName = dbDevice => ({
  name: `Device ${dbDevice._id.substr(0, 6)}`,
  ...dbDevice,
});

/**
 * @class
 * @extends DatabaseAdapter
 */
class DeviceDB extends DatabaseAdapter {
  createWithSecretAndName(secretHex, deviceName) {
    return this.create({
      secretKey: secretHex,
      name: deviceName,
      _id: uuidv4(),
    });
  }

  all() {
    return super.all().then(docs => docs.map(withDefaultName));
  }

  destroyAll() {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved);
        }
      });
    });
  }
}

module.exports = DeviceDB;
