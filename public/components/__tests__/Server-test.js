/* eslint-env jest */

const Server = require('../Server');
const net = require('net');

const testPort = 9000;

let server = null;
const setup = options => new Server(testPort, options);

describe('Server', () => {
  afterEach(() => {
    server.close();
  });

  it('Starts a server on the correct port', (done) => {
    server = setup();

    net.connect({ testPort }, () => {
      done();
    });
  });

  it('It uses keys if provided', () => {
    server = setup(testPort);

    expect(server.status()).toEqual();
  });

  it('It allows listening to data');
  it('It stores data');
});
