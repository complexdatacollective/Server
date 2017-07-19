/* eslint-disable no-console */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const Settings = require('./settings');

const defaultPort = 8080;
const events = [];

class Server extends Emitter {
  constructor(options = { port: defaultPort, keys: null }) {
    super();
    this.options = options;
    this.server = io(this.options.port);
    this.listen();
    console.log(`Server started on port ${this.options.port}.`);
  }

  listen() {
    console.log('listen');
    this.server.on('connect', (socket) => {
      console.log('Client connected.');

      const ps = new PrivateSocket(socket, { keys: this.options.keys });
      console.log('Private socket established, listening...');

      ps.on('data', (data) => {
        console.log('Received:', data);
      });
    });
  }

  clients() {
    return Object.keys(this.server.sockets.sockets).length;
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }

    return this.server.on(name, cb);
  }
}

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
  Settings.get()
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
