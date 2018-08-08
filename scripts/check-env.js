/* eslint-env node */
/* eslint-disable no-console */

const process = require('process');
const chalk = require('chalk');

const supportedPlatforms = [
  'darwin',
  'linux',
  'win32',
];

const desiredPlatform = process.argv[2];
if (!desiredPlatform || !supportedPlatforms.includes(desiredPlatform)) {
  console.log(chalk.yellow(`Usage: node ${__filename} [darwin|linux|win32]`));
  process.exit(1);
}

if (desiredPlatform !== process.platform) {
  console.log(chalk.red(`This script must be run under ${desiredPlatform}. Current platform: ${process.platform}`));
  process.exit(2);
}
