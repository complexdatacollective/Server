const miss = require('mississippi');

const debugStream = prefix => miss.through(
  (chunk, enc, cb) => {
    console.log(`[stream:${prefix}]`, chunk.toString()); // eslint-disable-line
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
      console.log(`[count:${prefix}]`, count); // eslint-disable-line
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
        console.log(`[sample:${prefix}:${count}]`, chunk.toString()); // eslint-disable-line
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
