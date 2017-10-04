/* eslint-disable class-methods-use-this */

const Emitter = require('events');
const io = require('socket.io');
const PrivateSocket = require('private-socket');
const os = require('os');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options) {
    super();
    if (!port) return;


    this.options = options;
    this.started = new Date().getTime();

    const server = require('http').createServer();
    const io = require('socket.io')({
      serveClient: false
    });

    this.socketServer = server;
    io.attach(port);
    // this.socketServer = io(port, { serveClient: false });

    // this.socketServer.listen(port);
    console.log('server', server);
    // server.listen(port)
    this.listen();
  }

  close() {
    this.socketServer.close();
  }

  listen() {
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
      clients: Object.keys(this.socketServer.sockets.sockets).length,
      publicKey: this.options.keys.publicKey,
    };
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
    console.log('socket', this.socketServer);
    return this.socketServer.on(name, cb);
  }
}

module.exports = Server;
