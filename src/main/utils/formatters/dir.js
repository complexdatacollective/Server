const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDirPrefix = 'org.codaco.server.exporting.';
const makeTempDir = () =>
  new Promise((resolve, reject) => {
    fs.mkdtemp(path.join(os.tmpdir(), tmpDirPrefix), (err, dir) => {
      if (err) {
        reject(err);
      } else {
        resolve(dir);
      }
    });
  });

module.exports = {
  makeTempDir,
  tmpDirPrefix,
};
