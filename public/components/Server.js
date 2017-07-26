/* eslint-disable no-console */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');

const events = [];

class Server extends Emitter {
  constructor(port, options = { keys: null }) {
    super();
    this.options = options;
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

module.exports = Server;
