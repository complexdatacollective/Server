/* eslint-disable no-console */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const Settings = require('./settings');

const defaultPort = 8080;
const events = [];

class Server extends Emitter {
  constructor({ port, keys } = { keys: null }) {
    super();
    this.keys = keys;
    this.server = io(port);
    this.listen();
    console.log(`Server started on port ${port}.`);
  }

  listen() {
    console.log('listen');
    this.server.on('connect', (socket) => {
      console.log('Client connected.');

      const ps = new PrivateSocket(socket, { keys: this.keys });
      console.log('Private socket established, listening...');

      ps.on('data', (data) => {
        console.log('Received:', data);
      });
    });
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }

    return this.server.on(name, cb);
  }
}

const getSettings = () => Settings.get();

const saveSettings = settings => Settings.set(settings);

const ensurePemKeyPair = (settings) => {
  if (!settings || !settings.keys) {
    return PrivateSocket.generatePemKeyPair()
      .then(
        keypair =>
          Object.assign({}, settings, { keys: keypair }),
      );
  }

  return settings;
};

const createServer = port =>
  getSettings()
    .then(ensurePemKeyPair)
    .then(saveSettings)
    .then((settings) => {
      const options = Object.assign(
        { port },
        settings,
      );

      return new Server(options);
    });

if (require.main === module) {
  createServer(defaultPort);
}

exports.createServer = createServer;
