const spawn = require('child_process').spawn;

const promiseCommand = (command, data = []) => {
  const [executable, ...args] = command.split(' ');

  console.log('promiseCommand', { executable, args, data });

  const process = spawn(executable, args);

  const commandInstance = new Promise((resolve) => {
    let result = '';

    process.stdout.on('data', (d) => {
      result += d;
    });

    process.stdout.on('end', () => {
      resolve(result);
    });

    process.stdin.write(data);
    process.stdin.end();
  });

  commandInstance.abort = () => {
    process.kill();
  };

  return commandInstance;
};

module.exports = promiseCommand;
