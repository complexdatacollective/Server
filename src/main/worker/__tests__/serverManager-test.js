/* eslint-env jest, jasmine */

const path = require('path');
const { createServer, actions } = require('../serverManager');

const testPort = 9001; // Auto find port
const testDataDir = path.join('.');

describe('serverManager', () => {
  describe('createServer', () => {
    // Allow extra time for server startup tests
    const defaultTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    beforeAll(() => { jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000; });
    afterAll(() => { jasmine.DEFAULT_TIMEOUT_INTERVAL = defaultTimeout; });

    it('starts/stops', (done) => {
      createServer(testPort, testDataDir).then((sp) => {
        sp.process.on('exit', (code) => {
          expect(code).toBe(0);
          done();
        });

        sp.stop();
      });
    });

    it('returns status', (done) => {
      createServer(testPort, testDataDir).then((sp) => {
        sp.process.on('exit', () => {
          done();
        });

        sp.on(actions.SERVER_STATUS, ({ data }) => {
          expect(Object.hasOwnProperty.call(data, 'ip')).toEqual(true);
          expect(Object.hasOwnProperty.call(data, 'uptime')).toEqual(true);
          expect(Object.hasOwnProperty.call(data, 'publicKey')).toEqual(true);
          sp.stop();
        });

        sp.send({ action: actions.REQUEST_SERVER_STATUS });
      });
    });

    it('can persist settings', (done) => {
      createServer(testPort, testDataDir).then((sp) => {
        sp.on(actions.SERVER_STATUS, ({ data }) => {
          const publicKey = data.publicKey;
          sp.stop();

          createServer(testPort, testDataDir).then((sp2) => {
            sp2.process.on('exit', (code) => {
              expect(code).toBe(0);
              done();
            });

            sp2.on(actions.SERVER_STATUS, ({ data: data2 }) => {
              expect(data2.publicKey).toEqual(publicKey);
              sp2.stop();
            });

            sp2.send({ action: actions.REQUEST_SERVER_STATUS });
          });
        });

        sp.send({ action: actions.REQUEST_SERVER_STATUS });
      });
    });
  });
});
