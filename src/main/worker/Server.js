const { EventEmitter } = require('events');
const os = require('os');
const mdns = require('mdns');
const logger = require('electron-log');

const { DeviceService, deviceServiceEvents } = require('./deviceService');
const { AdminService } = require('./adminService');

class Server extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.started = new Date().getTime();
  }

  /**
   * Starts the Admin service (to serve GUI) and Device service (for external clients)
   * @param  {number} port
   * @return {Server} this
   */
  startServices(port) {
    const dataDir = this.options.dataDir;
    this.adminService = new AdminService({ statusDelegate: this, dataDir });
    this.deviceService = new DeviceService({ dataDir });

    return Promise.all([
      // TODO: use port param for device Service
      this.adminService.start(port),
      this.deviceService.start().then(service => this.advertiseDeviceService(service)),
    ]).then(() => this);
  }

  get connectionInfo() {
    return {
      adminService: {
        port: this.adminService && this.adminService.port,
      },
      deviceService: {
        port: this.deviceService && this.deviceService.port,
      },
    };
  }

  // TODO: return promise of all
  close() {
    if (this.deviceService) {
      this.deviceService.stop();
    }
    if (this.adminService) {
      this.adminService.stop();
    }
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

  // eslint-disable-next-line class-methods-use-this
  publicIP() {
    const addrs = Object.values(os.networkInterfaces());
    return [].concat(...addrs)
      .find(val => val.family === 'IPv4' && val.internal === false);
  }

  on(name, cb) {
    let emitter = null;
    if (deviceServiceEvents && deviceServiceEvents[name]) {
      emitter = this.deviceService;
    }

    if (emitter) {
      logger.debug('Registering event', name, 'with', emitter.constructor.name);
      emitter.on(name, cb);
    }

    return this;
  }
}

module.exports = Server;
