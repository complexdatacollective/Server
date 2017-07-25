const { createServer } = require('./components/serverManager');

createServer(8080).then((server) => {
  server.stop();
});
