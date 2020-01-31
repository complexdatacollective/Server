const split = require('split');

const args = process.argv.slice(2);

if (args[0] === '--buffered') {
  // BUFFER MODE
  let buffer = '';
  process.stdin.on('data', (data) => {
    buffer += data.toString();
  });

  process.stdin.on('end', () => {
    // imaginary latency
    setTimeout(() => {
      process.stdout.write(`BUFFERED:${buffer.split('').reverse().join('')}`);
      process.exit(0);
    }, 1);
  });
} else {
  // REPL MODE
  process.stdin
    .pipe(split())
    .on('data', (data) => {
      const reversed = data.toString().split('').reverse().join('');

      // imaginary latency
      setTimeout(() => {
        process.stdout.write(`${reversed}\n`);
      }, 1);
    });

  process.stdout.write('REPL:\n');
}
