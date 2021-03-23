const split = require('split');

const args = process.argv.slice(2);

const doThing = (input) => [input.toUpperCase(), '.end'].join('');

if (args[0] === '--buffered') {
  // BUFFER MODE
  let buffer = '';
  process.stdin.on('data', (data) => {
    buffer += data.toString();
  });

  process.stdin.on('end', () => {
    const processed = doThing(buffer);

    // imaginary latency
    setTimeout(() => {
      process.stdout.write(`BUFFERED:${processed}`);
      process.exit(0);
    }, 1);
  });
} else {
  // REPL MODE
  const stream = process.stdin.pipe(split());

  stream
    .on('data', (data) => {
      const processed = doThing(data.toString());

      // imaginary latency
      setTimeout(() => {
        process.stdout.write(`${processed}\n`);
      }, 1);
    });

  process.stdout.write('REPL:\n');
}
