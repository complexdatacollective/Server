/* eslint-disable class-methods-use-this */
const Emitter = require('events').EventEmitter;
const os = require('os');
const mdns = require('mdns');
const logger = require('electron-log');

const { DeviceService } = require('./deviceService');
const { AdminService } = require('./adminService');

const events = ['data'];

class Server extends Emitter {
  constructor(port, options) {
    super();
    this.options = options;
    this.started = new Date().getTime();
    this.advertiseDeviceService = this.advertiseDeviceService.bind(this);

    if (options.startServices) {
      // these service create a high-level API that is exposed to the front-end
      this.deviceService = new DeviceService(options);
      this.deviceService.start()
        .then(this.advertiseDeviceService)
        .catch(console.error);
      this.adminService = new AdminService({ statusDelegate: this });
      this.adminService.start(port);
    }
  }

  close() {
    this.deviceService.stop();
    this.adminService.stop();
    this.deviceAdvertisement.stop();
  }

  advertiseDeviceService(deviceService) {
    if (this.deviceAdvertisement) {
      this.deviceAdvertisement.stop();
    }
    const serviceType = { name: 'network-canvas', protocol: 'tcp' };
    this.deviceAdvertisement = mdns.createAdvertisement(
      serviceType,
      deviceService.port,
      { name: 'network-canvas' }
    );
    this.deviceAdvertisement.start();
    logger.info(`MDNS: advertising ${JSON.stringify(serviceType)} on ${deviceService.port}`);
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
