const ChildProcess = require('duplex-child-process')

const commandRunner = (command) => {
  const [executable, ...args] = command.split(' ');
  if (!executable) { throw new Error('no executable specified'); }
  return ChildProcess.spawn(executable, args);
};

module.exports = commandRunner;
