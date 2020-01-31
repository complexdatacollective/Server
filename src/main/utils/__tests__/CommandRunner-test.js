/* eslint-env jest */
const commandRunner = require('../commandRunner');
const split = require('split');

// example_command.js reverses stdin
const testCommand = 'node ./src/main/utils/__tests__/example_command.js';

describe('commandRunner', () => {
  it('can initialize', () => {
    const process = commandRunner(testCommand);
  });

  it('is writable', () => {
    const process = commandRunner(testCommand);
    process.write('buzz\n');
  });

  it('is readable', (done) => {
    const process = commandRunner(testCommand);
    const dataHandler = jest.fn();

    process
      .pipe(split())
      .on('data', (d) => { dataHandler(d.toString()); });

    process.write('foo\n');
    process.write('bar\n');

    setTimeout(() => {
      expect(dataHandler.mock.calls).toEqual([['REPL:'], ['oof'], ['rab']]);
      done();
    }, 1000);
  });

  it('is killable', () => {
    const process = commandRunner(testCommand);
    process.kill();
  });

  it('handles end/done', (done) => {
    const process = commandRunner(`${testCommand} --buffered`);

    process.on('data', (d) => {
      expect(d.toString()).toEqual('BUFFERED:zzubzzif');
      done();
    });
    process.write('fizz');
    process.write('buzz');
    setTimeout(() => {
      process.end();
    }, 40);
  });
});
