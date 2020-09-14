const child = require('duplex-child-process');
const fs = require('fs-extra');

/**
 * `command` should be an array in the format:
 * [
 *    interpreter, // path to executable, e.g. /usr/bin/python
 *    script, // Path to user script e.g. /home/user/resolver.py
 *    ...args, // Array of arguments
 * ]
 */
const spawnCommand = (command) => {
  const [interpreter, script, ...args] = command;

  // return fs.pathExists(interpreter)
  //   .catch(() => { throw new Error(`Could not find interpreter "${interpreter}"`); })
  //   .then(fs.pathExists(script))
  return fs.pathExists(script)
    .catch(() => { throw new Error(`Could not find resolver script "${script}"`); })
    .then(() => {
      const spawnArgs = [script, ...args];
      const spawnProcess = () => child.spawn(interpreter, spawnArgs);
      return spawnProcess;
    });
};

module.exports = spawnCommand;
