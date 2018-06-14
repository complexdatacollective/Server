const fs = require('fs');

const readFile = (path, options) => (new Promise((resolve, reject) => {
  const args = [path];
  if (options) {
    args.push(options);
  }
  args.push((err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  });
  fs.readFile.apply(null, args);
}));

const rename = (oldPath, newPath) => (new Promise((resolve, reject) => {
  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
}));

const unlink = path => (new Promise((resolve, reject) => {
  fs.unlink(path, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
}));

const tryUnlink = path => unlink(path).catch(() => {});

module.exports = {
  readFile,
  rename,
  tryUnlink,
  unlink,
};
