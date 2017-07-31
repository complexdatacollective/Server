/* eslint-env jest */

const { createServer } = require('../serverManager');

const testPort = 0;  // Auto find port
const testDb = 'db/app-test';

describe('serverManager', () => {
  describe('createServer', () => {
    it('starts', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.stop();
        done();
      });
    });

    it('stops', (done) => {
      createServer(testPort, testDb).then((sp) => {
        // Too much knowledge about implementation, suggestions?
        sp.process.on('exit', (code) => {
          expect(code).toBe(0);
          done();
        });

        sp.stop();
      });
    });

    it('returns status', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.on(({ action, data }) => {
          if (action === 'SERVER_STATUS') {
            expect(Object.hasOwnProperty.call(data, 'ip')).toEqual(true);
            expect(Object.hasOwnProperty.call(data, 'uptime')).toEqual(true);
            expect(Object.hasOwnProperty.call(data, 'clients')).toEqual(true);
            expect(Object.hasOwnProperty.call(data, 'publicKey')).toEqual(true);
            sp.stop();
            done();
          }
        });

        sp.send({ action: 'REQUEST_SERVER_STATUS' });
      });
    });

    it('can persist settings', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.on(({ action, data }) => {
          if (action === 'SERVER_STATUS') {
            const publicKey = data.publicKey;
            sp.stop();

            createServer(testPort, testDb).then((sp2) => {
              sp2.on(({ action: action2, data: data2 }) => {
                if (action2 === 'SERVER_STATUS') {
                  expect(data2.publicKey).toEqual(publicKey);
                  sp2.stop();
                  done();
                }
              });

              sp2.send({ action: 'REQUEST_SERVER_STATUS' });
            });
          }
        });

        sp.send({ action: 'REQUEST_SERVER_STATUS' });
      });
    });
  });
});
