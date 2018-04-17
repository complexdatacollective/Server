/* eslint-disable no-console */
// This script is for development (see Readme)
const { app } = require('electron');
const path = require('path');

const { createServer } = require('../src/main/server/ServerFactory');

let dbSettings = path.join(path.dirname(require.main.filename), 'db', 'settings.json');
const port = process.env.port || 8080;
if (app) {
  dbSettings = path.join(app.getPath('userData'), 'db', 'settings.json');
}

createServer(port, dbSettings)
  .then((server) => {
    console.log('Server running', server.connectionInfo);
  });
