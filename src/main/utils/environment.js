const platform = require('os').platform();

const isLinux = platform === 'linux';
const isMacOS = platform === 'darwin';
const isWindows = platform === 'win32';

module.exports = {
  isLinux,
  isMacOS,
  isWindows,
};
