/* eslint-env jest */
const commandRunner = require('../commandRunner');
const miss = require('mississippi');
const split = require('split'); // use each?

// example_command.js reverses stdin
const testCommand = ['node', './src/main/utils/__tests__/example_command.js'];

describe('commandRunner', () => {
  it('can initialize', () => commandRunner(testCommand));

  it('is writable', () =>
    commandRunner(testCommand)
      .then((startProcess) => {
        const p = startProcess();
        p.write('buzz');
        p.end();
      }),
  );

  it('is readable', () => {
    const dataHandler = jest.fn();

    expect.assertions(1);

    return expect(
      commandRunner(testCommand)
        .then(runProcess => new Promise((resolve) => {
          const stream = miss.pipeline(
            runProcess(),
            split(),
          );

          stream.on('data', (d) => {
            dataHandler(d.toString());
          });

          stream.on('end', () => {
            resolve();
          });

          stream.write('foo\nbar');
          stream.end();
        }))
        .then(() => dataHandler.mock.calls),
    ).resolves.toEqual([['REPL:'], ['FOO.end'], ['BAR.end']]);
  });

  it('is killable', (done) => {
    commandRunner(testCommand)
      .then((start) => {
        const p = start();
        p.on('end', () => {
          done();
        });
        p.kill();
      })
      .finally(done);
  });

  it('handles end/done', (done) => {
    commandRunner([...testCommand, '--buffered'])
      .then((start) => {
        const p = start();
        p.on('data', (d) => {
          expect(d.toString()).toEqual('BUFFERED:FIZZ\nBUZZ.end');
          done();
        });
        p.write('fizz\nbuzz');
        setTimeout(() => {
          p.end();
        }, 40);
      });
  });
});
