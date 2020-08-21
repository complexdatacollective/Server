const miss = require('mississippi');

const debug = (...args) => {
  if (process.env !== 'development') { return; }
  console.log(...args); // eslint-disable-line
};

const debugStream = prefix => miss.through(
  (chunk, enc, cb) => {
    debug(`[stream:${prefix}]`, chunk.toString()); // eslint-disable-line
    cb(null, chunk);
  },
  (cb) => {
    cb(null);
  },
);

const countStream = (prefix) => {
  let count = 0;
  return miss.through(
    (chunk, enc, cb) => {
      count += 1;
      cb(null, chunk);
    },
    (cb) => {
      debug(`[count:${prefix}]`, count);
      cb(null);
    },
  );
};

const sampleStream = (prefix, sampleSize) => {
  let count = 0;
  return miss.through(
    (chunk, enc, cb) => {
      count += 1;
      if (count <= sampleSize) {
        debug(`[sample:${prefix}:${count}]`, chunk.toString());
      }
      cb(null, chunk);
    },
    (cb) => {
      cb(null);
    },
  );
};

module.exports = {
  debugStream,
  countStream,
  sampleStream,
};
