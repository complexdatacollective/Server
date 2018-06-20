const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const paths = require('../config/paths');
const { ApiVersion } = require('../src/main/server/devices/DeviceAPI');
const { DefaultApiPort } = require('../src/main/server/devices/DeviceService');

const deviceApiSource = path.join(__dirname, '..', 'src', 'main', 'server', 'devices', 'DeviceAPI.js');

if (!fs.existsSync(deviceApiSource)) {
  throw new Error(`Device API source not found at ${deviceApiSource}`);
}

const options = {
  swaggerDefinition: {
    host: `localhost:${DefaultApiPort}`,
    basePath: '/',
    schemes: ['http'],
    info: {
      title: 'Network Canvas Devices API',
      description: 'REST API for paired tablet & desktop clients',
      version: ApiVersion,
    },
  },
  // Path to the API docs
  apis: [deviceApiSource],
};

const destDir = path.join(paths.config, 'api');
const destPath = path.join(destDir, `api-spec-${ApiVersion}.json`);
const destFile = fs.openSync(destPath, 'w');

const apiSpec = swaggerJSDoc(options);
fs.writeSync(destFile, JSON.stringify(apiSpec, null, 2));

console.log('Generated OpenAPI spec:', destPath);
