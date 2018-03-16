/* eslint-disable class-methods-use-this */
const Emitter = require('events').EventEmitter;
const os = require('os');
const mdns = require('mdns');
const logger = require('electron-log');

const { DeviceService } = require('./deviceService');
const { AdminService } = require('./adminService');

const events = ['data'];

class Server extends Emitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.started = new Date().getTime();
    this.advertiseDeviceService = this.advertiseDeviceService.bind(this);
  }

  startServices(port) {
    return new Promise((resolve) => {
      this.adminService = new AdminService({ statusDelegate: this });
      this.adminService.start(port);
      this.deviceService = new DeviceService();
      this.deviceService.start()
        .then(this.advertiseDeviceService)
        .then(() => resolve(this));
    });
  }

  close() {
    this.deviceService.stop();
    this.adminService.stop();
    this.stopAdvertisements();
  }

  advertiseDeviceService(deviceService) {
    if (this.deviceAdvertisement) {
      this.deviceAdvertisement.stop();
    }
    const serviceType = { name: 'network-canvas', protocol: 'tcp' };
    this.deviceAdvertisement = mdns.createAdvertisement(
      serviceType,
      deviceService.port,
      { name: 'network-canvas' },
    );
    this.deviceAdvertisement.start();
    logger.info(`MDNS: advertising ${JSON.stringify(serviceType)} on ${deviceService.port}`);
  }

  stopAdvertisements() {
    if (this.deviceAdvertisement) {
      this.deviceAdvertisement.stop();
    }
  }

  status() {
    return {
      uptime: new Date().getTime() - this.started,
      ip: this.publicIP(),
      publicKey: this.options.keys && this.options.keys.publicKey,
    };
  }

  publicIP() {
    const addrs = Object.values(os.networkInterfaces());
    return [].concat(...addrs)
      .find(val => val.family === 'IPv4' && val.internal === false);
  }

  on(name, cb, ...rest) {
    if (events.indexOf(name) !== -1) {
      return Emitter.prototype.on.apply(this, [name, cb, ...rest]);
    }
    return null;
  }
}

module.exports = Server;
