/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const uuidv4 = require('uuid/v4');

const DatabaseAdapter = require('./DatabaseAdapter');

const withDefaultName = dbDevice => ({
  name: `Device ${dbDevice._id.substr(0, 6)}`,
  ...dbDevice,
});

/**
 * @class
 */
class DeviceDB extends DatabaseAdapter {
  create(secretHex, deviceName) {
    return new Promise((resolve, reject) => {
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
