/* eslint-disable no-console */
// This script is for development (see Readme)
const { app } = require('electron');
const path = require('path');

const { createServer } = require('./worker/serverManager');

let server = null;
let dbSettings = path.join(path.dirname(require.main.filename), 'db', 'settings.json');
const port = process.env.port || 8080;
if (app) {
  dbSettings = path.join(app.getPath('userData'), 'db', 'settings.json');
}

createServer(port, dbSettings)
.then((serverProcess) => {
  server = serverProcess;
  server.on('REQUEST_SERVER_STATUS', (event) => {
    console.log('request received', event);
    serverProcess.on(
      'SERVER_STATUS',
      ({ data }) => {
        console.log(data);
        event.sender.send('SERVER_STATUS', data);
      },
    );

    serverProcess.send({ action: 'REQUEST_SERVER_STATUS' });
  });
});

console.log(`Server running on port ${port}`);
