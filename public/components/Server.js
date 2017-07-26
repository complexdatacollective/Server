/* eslint-disable class-methods-use-this */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const os = require('os');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options = { keys: null }) {
    super();
    this.options = options;
    this.started = new Date().getTime();
    this.server = io(port);
    this.listen();
    console.log(`Server started on port ${port}.`);
  }

  listen() {
    this.server.on('connect', (socket) => {
      console.log('Client connected.');

      const ps = new PrivateSocket(socket, { keys: this.options.keys });
      console.log('Private socket established, listening...');

      ps.on('data', (data) => {
        // TODO: Could store data here?
        this.emit('data', data);
      });
    });
  }

  clients() {
    return Object.keys(this.server.sockets.sockets).length;
  }

  ip() {
    return os.networkInterfaces();
  }

  status() {
    return {
      started: this.started,
      ip: this.ip(),
      clients: this.clients(),
      publicKey: this.options.keys.publicKey,
    };
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }

    return this.server.on(name, cb);
  }
}

module.exports = Server;
