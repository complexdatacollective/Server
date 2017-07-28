/* eslint-disable class-methods-use-this */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const os = require('os');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options = { keys: null }) {
    super();
    if (!port) return;
    this.options = options;
    this.started = new Date().getTime();
    this.server = io(port);
    this.listen();
    console.log(`Server started on port ${port}.`);
  }

  close() {
    this.server.close();
  }

  listen() {
    this.server.on('connect', (socket) => {
      console.log('Client connected.');

      const ps = new PrivateSocket(socket, { keys: this.options.keys });
      console.log('Private socket established, listening...');

      ps.on('data', (data) => {
        // TODO: Could store data here or in some kind of HOC?
        this.emit('data', data);
      });
    });
  }

  status() {
    return {
      uptime: new Date().getTime() - this.started,
      ip: os.networkInterfaces(),
      clients: Object.keys(this.server.sockets.sockets).length,
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
