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

    console.log(chunk);

    // Emit "chunk" from the stream.
    return next(null, chunk);
  });
};

const to = miss.to(
  (data, enc, cb) => {
    console.log('writing', data.toString());
    cb();
  },
  cb => cb(),
);

const commandRunner = () =>
  Promise.resolve(
    () => miss.duplex(to, fromString('hello world')),
  );

module.exports = commandRunner;
