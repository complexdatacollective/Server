const fs = require('fs');

const resolveOrRejectWith = (resolve, reject) => (err) => {
  if (err) {
    reject(err);
  } else {
    resolve();
  }
};

const mkdir = (path, mode) => (new Promise((resolve, reject) => {
  const args = [path];
  if (mode) {
    args.push(mode);
  }
  args.push(resolveOrRejectWith(resolve, reject));
  try {
    fs.mkdir.apply(null, args);
  } catch (err) { reject(err); }
}));

const writeFile = (file, data, options) => (new Promise((resolve, reject) => {
  const args = [file, data];
  if (options) {
    args.push(options);
  }
  args.push(resolveOrRejectWith(resolve, reject));
  try {
    fs.writeFile.apply(null, args);
  } catch (err) { reject(err); }
}));

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
  try {
    fs.readFile.apply(null, args);
  } catch (err) { reject(err); }
}));

const rename = (oldPath, newPath) => (new Promise((resolve, reject) => {
  try {
    fs.rename(oldPath, newPath, resolveOrRejectWith(resolve, reject));
  } catch (err) { reject(err); }
}));

const unlink = path => (new Promise((resolve, reject) => {
  try {
    fs.unlink(path, resolveOrRejectWith(resolve, reject));
  } catch (err) { reject(err); }
}));

const tryUnlink = path => unlink(path).catch(() => {});

module.exports = {
  mkdir,
  readFile,
  rename,
  tryUnlink,
  unlink,
  writeFile,
};
