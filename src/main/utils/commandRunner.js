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

  return Promise.all([
    fs.pathExists(interpreter),
    fs.pathExists(script),
  ])
    // .catch((e) => {
    //   throw new Error('Could not find command, or it is not executable.');
    // })
    .then(() => {
      const spawnArgs = [script, ...args];
      console.log({ spawnArgs });
      const spawnProcess = () => child.spawn(interpreter, spawnArgs);
      return spawnProcess;
    });
};

module.exports = spawnCommand;
