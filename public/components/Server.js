/* eslint-disable class-methods-use-this */

const Emitter = require('events').EventEmitter;
// const WebSocket = require('ws');
const io = require('socket.io')({
  serveClient: false,
  origins: '*:*'
});
const PrivateSocket = require('private-socket');
const os = require('os');
const cote = require('cote');
const DiscoveryService = require('./discoveryService');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options) {
    super();
    if (!port) return;
    io.attach(port, {
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false
    });

    this.options = options;
    this.started = new Date().getTime();
    this.socketServer = io;
    this.sockend = new cote.Sockend(io, { name: 'sockend' });

    this.discoveryService = new DiscoveryService(options);
    this.listen();
  }

  close() {
    this.socketServer.close();
  }

  listen() {
    io.on('connection', (socket) => {
      console.log('connected');
      socket.on('REQUEST_SERVER_STATUS', () => {
        socket.emit('SERVER_STATUS', JSON.stringify(this.status()));
      });
    });

    this.on('connect', (socket) => {
      // When a server connects generate a private socket
      const socketOptions = Object.assign({}, this.options);
      const ps = new PrivateSocket(socket, socketOptions);

      // When we get data from the privatesocket delegate to self:
      // i.e. Server.on('data', ...);
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
      clients: this.socketServer.engine.clientsCount,
      publicKey: this.options.keys.publicKey,
    };
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
  }
}

module.exports = Server;
