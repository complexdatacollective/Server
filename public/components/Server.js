/* eslint-disable class-methods-use-this */

const Emitter = require('events').EventEmitter;
const WebSocket = require('ws');
const PrivateSocket = require('private-socket');
const os = require('os');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options) {
    super();
    if (!port) return;

    this.options = options;
    this.started = new Date().getTime();
    this.socketServer = new WebSocket.Server({ port });

    this.listen();
  }

  close() {
    this.socketServer.close();
  }

  listen() {
    this.socketServer.on('connection', (socket) => {
      // When a server connects generate a private socket
      const socketOptions = Object.assign({}, this.options);
      const ps = new PrivateSocket(socket, socketOptions);

      // When we get data from the privatesocket delegate to self:
      // i.e. Server.on('data', ...);
      ps.on('data', (data) => {
        // TODO: Could store data here or in some kind of HOC?
        this.emit('data', data);
      });

      socket.isAlive = true;
      socket.on('pong', this.heartbeat);
      this.heartbeatInterval = 60;

      setInterval(() => {
        if (!this.socketServer.clients) {
          this.socketServer.close();
        }
        this.socketServer.clients.forEach((client) => {
          if (client.isAlive === false) {
            console.log('terminating dead client');
            client.terminate();
          }

          client.isAlive = false;
          console.log('heartbeat event fired');
          client.ping('', false, true);
          client.send(JSON.stringify(this.status()));
        });
      }, 1000 * this.heartbeatInterval);


      socket.on('message', (message) => {
        console.log('socket received: %s', message);
        if (message === 'REQUEST_SERVER_STATUS') {
          socket.send(JSON.stringify(this.status()));
        }
      });
    });
  }

  status() {
    return {
      uptime: new Date().getTime() - this.started,
      ip: os.networkInterfaces(),
      clients: this.socketServer.clients.size,
      publicKey: this.options.keys.publicKey,
    };
  }

  heartbeat() {
    this.isAlive = true;
    console.log(new Date().getTime());
  }

  on(name, cb, ...rest) {
    console.log(name);
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
  }
}

module.exports = Server;
