/* eslint-disable class-methods-use-this */
const Emitter = require('events').EventEmitter;
const os = require('os');

const { DeviceService } = require('./deviceService');
const { AdminService } = require('./adminService');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options) {
    super();
    this.options = options;
    this.started = new Date().getTime();

    if (options.startServices) {
      // these service create a high-level API that is exposed to the front-end
      this.deviceService = new DeviceService(options);
      this.deviceService.start();
      this.adminService = new AdminService({ port, statusDelegate: this });
      this.adminService.start();
    }
  }

  close() {
    this.deviceService.stop();
    this.adminService.stop();
  }

  status() {
    return {
      uptime: new Date().getTime() - this.started,
      ip: this.publicIP(),
      // clients: this.socketServer.engine.clientsCount,
      publicKey: this.options.keys.publicKey,
    };
  }

  publicIP() {
    const addrs = Object.values(os.networkInterfaces());
    return [].concat(...addrs)
      .find(val => val.family === 'IPv4' && val.internal === false)
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
  }
}

module.exports = Server;
