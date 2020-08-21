const miss = require('mississippi');

const mockResolve = (buffer) => {
  const ids = buffer.split('\n').slice(1).map(line => line.split(',')[0]);

  const matches = [];

  while (ids.length > 2) {
    const [id1, id2] = ids.splice(0, 2);
    matches.push(`${id1}, ${id2}, 0.5`);
  }

  return `networkCanvasAlterID_1,networkCanvasAlterID_2,prob\n${matches.join('\n')}`;
};

const commandRunner = () =>
  Promise.resolve(
    () => {
      let buffer = '';
      let complete = false;

      const stream = miss.duplex(
        miss.to((data, enc, cb) => {
          if (!data) { cb(null); }
          buffer += data;
          cb();
        }, (cb) => {
          buffer = mockResolve(buffer);
          complete = true;
          cb();
        }),
        miss.from((size, next) => {
          if (!complete) {
            // wait a bit
            setTimeout(() => next(null, ''), 5);
            return null;
          }

          // if there's no more content
          // left in the string, close the stream.
          if (buffer.length <= 0) {
            return next(null, null);
          }

          // Pull in a new chunk of text,
          // removing it from the source.
          const chunk = buffer.slice(0, size);
          buffer = buffer.slice(size);

          // Emit "chunk" from the stream.
          return next(null, chunk);
        }),
      );

      stream.prototype.kill = () => {};

      return stream;
    },
  );

module.exports = commandRunner;
