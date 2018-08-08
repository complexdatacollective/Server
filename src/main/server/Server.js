const { EventEmitter } = require('events');
const os = require('os');
const logger = require('electron-log');

const { DeviceService, deviceServiceEvents } = require('./devices/DeviceService');
const { AdminService } = require('./AdminService');
const { mdns, mdnsIsSupported } = require('./mdnsProvider');

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
    const keys = this.options.keys;
    this.adminService = new AdminService({ statusDelegate: this, dataDir });
    this.deviceService = new DeviceService({ dataDir, keys });

    return Promise.all([
      this.adminService.start(),
      this.deviceService.start(port).then(service => this.advertiseDeviceService(service)),
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

  close() {
    const promises = [];
    if (this.deviceService) {
      promises.push(this.deviceService.stop());
    }
    if (this.adminService) {
      promises.push(this.adminService.stop());
    }
    this.stopAdvertisements();
    return Promise.all(promises);
  }

  advertiseDeviceService(deviceService) {
    const serviceType = { name: 'network-canvas', protocol: 'tcp' };
    if (!mdnsIsSupported) {
      return;
    }
    if (this.deviceAdvertisement) {
      this.deviceAdvertisement.stop();
    }
    this.deviceAdvertisement = mdns.createAdvertisement(
      serviceType,
      deviceService.port,
      { name: os.hostname() },
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
      mdnsIsSupported,
      isAdvertising: !!this.deviceAdvertisement,
      hostname: os.hostname(),
      ip: this.publicIP(),
      deviceApiPort: this.connectionInfo.deviceService.port,
      uptime: new Date().getTime() - this.started,
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
