/* eslint-disable class-methods-use-this */
const cote = require('cote');
const Emitter = require('events').EventEmitter;
const _ = require('lodash');
const os = require('os');
const diont = require('diont')({
  broadcast: true
});
const PrivateSocket = require('private-socket');
const io = require('socket.io')({
  serveClient: false,
  origins: '*:*'
});

const DeviceService = require('./deviceService');

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

    const serverAdvertisement = {
      name: 'NetworkCanvasServer 1',
      port
    };

    if (options.startServices) {
      // these service create a high-level API that is exposed to the front-end
      this.sockend = new cote.Sockend(io, { name: 'sockend' });
      this.deviceService = new DeviceService(options);
      diont.announceService(serverAdvertisement);
    }

    this.listen();
  }

  close() {
    this.socketServer.close();
    this.socketServer.destroy();
  }

  listen() {
    io.on('connect', (socket) => {
      console.log('connected');
      // When a server connects generate a private socket
      // the private socket is a means of private communication between end user and server
      const socketOptions = Object.assign({}, this.options);
      const ps = new PrivateSocket(socket, socketOptions);

      ps.on('ready', () => {
        console.log('Private connection ready.');
      });

      ps.on('data', (data) => {
        console.log(`Received data from ${socket.id}:\n`, data);
      });

      ps.on('REQUEST_SERVER_STATUS', () => {
        console.log('SERVER REQUESTED');
        ps.socket.emit('SERVER_STATUS', JSON.stringify(this.status()));
      });
    });

    this.on('STOP_SERVER', () => {
      this.close();
    });
  }

  status() {
    return {
      uptime: new Date().getTime() - this.started,
      ip: this.publicIP(),
      clients: this.socketServer.engine.clientsCount,
      publicKey: this.options.keys.publicKey,
    };
  }

  publicIP() {
    const ip = _.chain(os.networkInterfaces())
    .values()
    .flatten()
    .filter(val => val.family === 'IPv4' && val.internal === false)
    .head()
    .value();

    return ip;
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
  }
}

module.exports = Server;
