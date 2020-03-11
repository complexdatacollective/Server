const child = require('child_process');
const miss = require('mississippi');
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

      resolve(() => {
        const spawnedProcess = child.spawn(executable, args);
        const processStream = miss.duplex(
          spawnedProcess.stdin, // readable
          spawnedProcess.stdout, // writeable
          { allowHalfOpen: false },
        );
        // processStream.exit = (code = 0) => {
        //   throw new Error();
        //   spawnedProcess.exit(code);
        // };
        processStream.kill = () => spawnedProcess.kill();
        // processStream.end = () => {
        //   console.log('happened');
        //   process.stdin.end();
        // };
        return processStream;
      });
    });
  });

const commandRunner = (command = '') =>
  getArgs(command)
    .then(spawnCommand);

module.exports = commandRunner;
