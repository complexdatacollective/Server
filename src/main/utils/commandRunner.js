const ChildProcess = require('duplex-child-process');

const getArgs = (command) => {
  if (!command) { throw new Error('no comand specified'); }
  const [executable, ...args] = command.split(' ');
  return { executable, args };
};

const commandRunner = (command = '') => {
  const { executable, args } = getArgs(command);
  if (!executable) { throw new Error('no executable specified as part of "command"'); }
  return ChildProcess.spawn(executable, args);
};

module.exports = commandRunner;
