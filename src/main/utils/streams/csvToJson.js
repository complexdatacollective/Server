/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

const trim = string =>
  string.trim().replace(/^"(.+)"$/g, '$1');

class CsvAsJsonStream extends Transform {
  constructor(options) {
    super(options);
    this._firstLine = true;
    this._keys = [];
  }

  _transform(data, encoding, callback) {
    try {
      // Ignore empty lines
      if (data.toString() === '') {
        callback();
        return;
      }

      // Get headings
      if (this._firstLine === true) {
        const keys = data.toString()
          .split(',')
          .map(trim);
        this._keys = keys;
        this._firstLine = false;
        callback();
        return;
      }

      const values = data.toString().split(',').map(trim);

      // Length of values must match length of headings
      if (values.length !== this._keys.length) {
        callback('csvToJson: Length values does not match length of headings.');
        return;
      }

      const obj = this._keys
        .reduce(
          (memo, key, index) =>
            ({ ...memo, [key]: values[index] }),
          {},
        );

      const output = JSON.stringify(obj);
      callback(null, output);
    } catch (err) {
      err.friendlyMessage = 'error in csvToJson()';
      callback(err);
    }
  }
}

module.exports = () => new CsvAsJsonStream();
