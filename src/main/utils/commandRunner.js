const ChildProcess = require('duplex-child-process');
const fs = require('fs');

const getArgs = command => new Promise((resolve, reject) => {
  if (!command) { reject(new Error('no comand specified')); }
  const [executable, ...args] = command.split(' ');
  resolve({ executable, args });
});

const spawnCommand = ({ executable, args }) =>
  new Promise((resolve, reject) => {
    if (!executable) { reject(new Error('no executable specified as part of "command"')); }
    fs.access(executable, fs.constants.R_OK, (error) => {
      if (error) { reject(new Error('could not find command')); }

      resolve(() => ChildProcess.spawn(executable, args));
    });
  });

const commandRunner = (command = '') =>
  getArgs(command)
    .then(spawnCommand);

module.exports = commandRunner;
