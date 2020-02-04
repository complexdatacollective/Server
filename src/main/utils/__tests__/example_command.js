const split = require('split');

const args = process.argv.slice(2);

const doThing = input =>
  // input.split('').reverse().join('');
  ['<line>', input.toUpperCase(), '</line>'].join('');

if (args[0] === '--buffered') {
  // BUFFER MODE
  let buffer = '';
  process.stdin.on('data', (data) => {
    buffer += data.toString();
  });

  process.stdin.on('end', () => {
    // imaginary latency
    setTimeout(() => {
      process.stdout.write(`BUFFERED:${doThing(buffer)}`);
      process.exit(0);
    }, 1);
  });
} else {
  // REPL MODE
  process.stdin
    .pipe(split())
    .on('data', (data) => {
      const reversed = doThing(data.toString());

      // imaginary latency
      setTimeout(() => {
        process.stdout.write(`${reversed}\n`);
      }, 1);
    });

  process.stdout.write('REPL:\n');
}
