/* eslint-env jest */

const path = require('path');
const { createServer, actions } = require('../serverManager');

const testPort = 0;  // Auto find port
const testDb = path.join('db', 'test');

describe('serverManager', () => {
  describe('createServer', () => {
    it('starts/stops', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.process.on('exit', (code) => {
          expect(code).toBe(0);
          done();
        });

        sp.stop();
      });
    });

    it('returns status', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.process.on('exit', () => {
          done();
        });

        sp.on(actions.SERVER_STATUS, ({ data }) => {
          expect(Object.hasOwnProperty.call(data, 'ip')).toEqual(true);
          expect(Object.hasOwnProperty.call(data, 'uptime')).toEqual(true);
          expect(Object.hasOwnProperty.call(data, 'clients')).toEqual(true);
          expect(Object.hasOwnProperty.call(data, 'publicKey')).toEqual(true);
          sp.stop();
        });

        sp.send({ action: actions.REQUEST_SERVER_STATUS });
      });
    });

    it('can persist settings', (done) => {
      createServer(testPort, testDb).then((sp) => {
        sp.on(actions.SERVER_STATUS, ({ data }) => {
          const publicKey = data.publicKey;
          sp.stop();

          createServer(testPort, testDb).then((sp2) => {
            sp2.process.on('exit', () => {
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
