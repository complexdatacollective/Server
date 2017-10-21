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
      clients: this.socketServer.clients.size,
      publicKey: this.options.keys.publicKey,
    };
  }

  heartbeat() {
    this.isAlive = true;
    console.log(new Date().getTime());
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }

    return this.socketServer.on('connection', (ws) => {
      ws.isAlive = true;
      ws.on('pong', this.heartbeat);
      this.heartbeatInterval = 60;

      setInterval(() => {
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


      ws.on('message', (message) => {
        console.log('received: %s', message);
        if (message === 'REQUEST_SERVER_STATUS') {
          ws.send(JSON.stringify(this.status()));
        }
        return ws.on(message, cb);
      });
    });
  }
}

module.exports = Server;
