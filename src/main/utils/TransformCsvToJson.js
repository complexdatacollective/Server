const { Transform } = require('stream');

class TransformCsvToJson extends Transform {
  constructor(options) {
    super(options);
    this._firstLine = true;
    this._keys = [];
  }

  _transform(data, encoding, callback) {
    // Ignore empty lines
    if (data.toString() === '') {
      callback();
      return;
    }

    // Get headings
    if (this._firstLine === true) {
      const keys = data.toString()
        .split(',')
        .map(key => key.trim());
      this._keys = keys;
      this._firstLine = false;
      callback();
      return;
    }

    const values = data.toString().split(',');

    // Length of values must match length of headings
    if (values.length !== this._keys.length) {
      callback('Length values does not match length of headings (in first row).');
      return;
    }

    const obj = this._keys
      .reduce(
        (memo, key, index) =>
          ({ ...memo, [key]: values[index].trim() }),
        {},
      );

    const result = JSON.stringify(obj);
    callback(null, result);
  }
}

module.exports = TransformCsvToJson;
