const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const paths = require('../config/paths');

const ApiVersion = '0.0.0';
const ApiPort = process.env.DEVICE_SERVICE_PORT || 51001; // See DeviceService

const options = {
  swaggerDefinition: {
    host: `localhost:${ApiPort}`,
    basePath: '/',
    schemes: ['http'],
    info: {
      title: 'Network Canvas Devices API',
      description: 'REST API for paired tablet & desktop clients',
      version: ApiVersion,
    },
  },
  // Path to the API docs
  apis: [path.join(__dirname, '..', 'src', 'main', 'worker', 'deviceService.js')],
};

const destDir = path.join(paths.config, 'api');
const destPath = path.join(destDir, `api-spec-${ApiVersion}.json`);
const destFile = fs.openSync(destPath, 'w');

const apiSpec = swaggerJSDoc(options);
fs.writeSync(destFile, JSON.stringify(apiSpec, null, 2));

console.log('Generated OpenAPI spec:', destPath);
