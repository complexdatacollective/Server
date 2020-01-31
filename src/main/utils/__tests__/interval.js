setInterval(() => {
  process.stdout.write(['foo', 'bar', 'bazz'][Math.floor(Math.random() * 2)]);
}, 1000);
