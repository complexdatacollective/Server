/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class MapStream extends Transform {
  constructor(mapFunc, options) {
    super(options);
    this._mapFunc = mapFunc;
  }

  _transform(data, encoding, callback) {
    this._mapFunc(data, callback);
  }
}

module.exports = MapStream;
