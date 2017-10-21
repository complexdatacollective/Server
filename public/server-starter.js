const { app } = require('electron');
const path = require('path');

const { createServer } = require('./components/serverManager');

let dbSettings = path.join(path.dirname(require.main.filename), 'db', 'settings.json');
const port = process.env.port || 8080;
let server = null;

if (app) {
  dbSettings = path.join(app.getPath('userData'), 'db', 'settings.json');

  // Quit spawned server process
  app.on('before-quit', () => {
    if (server) {
      server.stop();
    }
  });
}

createServer(port, dbSettings)
.then((serverProcess) => {
  server = serverProcess;
  server.send({ action: 'TEST_MESSAGE' });
});

console.log(`Server running on port ${port}`);
