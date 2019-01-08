/* eslint-env node */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const paths = require('../config/paths');
const { DeviceAPIConfig } = require('../src/main/apiConfig');

const deviceApiSource = path.join(__dirname, '..', 'src', 'main', 'server', 'devices', 'DeviceAPI.js');

if (!fs.existsSync(deviceApiSource)) {
  throw new Error(`Device API source not found at ${deviceApiSource}`);
}

const description = `This REST API provides endpoints for communication with [Network Canvas](https://github.com/codaco/Network-Canvas) clients.

HTTP endpoints cover initial client/server pairing, which uses an out-of-band pairing
code for security.

HTTPS endpoints handle communications between a paired Client & Server.
`;

const options = {
  swaggerDefinition: {
    host: `localhost:${DeviceAPIConfig.DefaultHttpsPort}`,
    basePath: '/',
    schemes: ['http', 'https'],
    info: {
      title: 'Network Canvas Devices API',
      description,
      version: DeviceAPIConfig.Version,
      license: {
        name: 'GNU General Public License v3.0',
        url: 'https://github.com/codaco/Server/blob/master/LICENSE',
      },
    },
  },
  // Path to the API docs
  apis: [deviceApiSource],
};

const destDir = path.join(paths.config, 'api');
const destPath = path.join(destDir, `api-spec-${DeviceAPIConfig.Version}.json`);
const destFile = fs.openSync(destPath, 'w');

const apiSpec = swaggerJSDoc(options);
fs.writeSync(destFile, JSON.stringify(apiSpec, null, 2));

console.log('Generated OpenAPI spec:', destPath);
