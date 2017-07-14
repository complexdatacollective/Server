/* eslint-disable no-console */

const Emitter = require('events').EventEmitter;
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const ip = require('ip');

const events = [];

class Server extends Emitter {
  constructor(port) {
    super();

    this.server = io(port);

    console.log(`Server started on port ${port}.`);

    this.server.on('connect', (socket) => {
      console.log('Client connected.');
      const ps = new PrivateSocket(socket);
      console.log('Private socket established, listening...');

      ps.on('data', (data) => {
        console.log('Received:', data);
      });
    });
  }

  getOverview() {
    console.log(this.server);
    return {
      ip: ip.address(),
      // port: this.server.port,
      // connections: this.server.sockets,
    };
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }

    return this.server.on(name, cb);
  }
}

const createServer = port => new Server(port);

if (require.main === module) {
  createServer(8081);
}

module.exports = createServer;
