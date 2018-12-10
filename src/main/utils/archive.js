const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// const zlibFastestCompression = 1;
// const zlibBestCompression = 9;
const zlibDefaultCompression = -1;

// Use zlib default: compromise speed & size
// archiver overrides zlib's default (with 'best speed'), so we need to provide it
const archiveOptions = {
  zlib: { level: zlibDefaultCompression },
  store: true,
};

/**
 * Write a bundled (zip) from source files
 * @param {string} destinationPath full FS path to write
 * @param {string[]} sourcePaths
 * @return Returns a promise that resolves to (sourcePath, destinationPath)
 */
const archive = (sourcePaths, destinationPath) =>
  new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destinationPath);
    const zip = archiver('zip', archiveOptions);

    output.on('close', () => {
      resolve(destinationPath);
    });

    output.on('warning', reject);
    output.on('error', reject);

    zip.pipe(output);

    zip.on('warning', reject);
    zip.on('error', reject);

    sourcePaths.forEach((sourcePath) => {
      zip.file(sourcePath, { name: path.basename(sourcePath) });
    });

    zip.finalize();
  });

// This is adapted from Architect; consider using `extract` as well
module.exports = {
  archive,
};
