const miss = require('mississippi');

const fromString = (string) => {
  let source = string;
  return miss.from((size, next) => {
    // if there's no more content
    // left in the string, close the stream.
    if (source.length <= 0) {
      return next(null, null);
    }

    // Pull in a new chunk of text,
    // removing it from the source.
    const chunk = source.slice(0, size);
    source = source.slice(size);

    // Emit "chunk" from the stream.
    return next(null, chunk);
  });
};

const source =
`networkCanvasAlterID_1,networkCanvasAlterID_2,prob
43970,43969,0.25
43971,43969,0.8`;

const commandRunner = () =>
  Promise.resolve(
    () =>
      miss.duplex(miss.to((data, enc, cb) => cb()), fromString(source)),
  );

module.exports = commandRunner;
