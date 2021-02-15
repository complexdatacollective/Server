const { EventEmitter } = require('events');
const os = require('os');
const logger = require('electron-log');

const { DeviceService, deviceServiceEvents } = require('./devices/DeviceService');
const { AdminService } = require('./AdminService');
const { ResolverService } = require('./ResolverService');
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
  startServices(httpPort, httpsPort) {
    const dataDir = this.options.dataDir;
    const keys = this.options.keys;
    this.adminService = new AdminService({ statusDelegate: this, dataDir });
    this.resolverService = new ResolverService({ dataDir });
    this.deviceService = new DeviceService({ dataDir, keys });

    return Promise.all([
      this.adminService.start(),
      this.resolverService.start(),
      this.deviceService
        .start(httpPort, httpsPort)
        .then(service => this.advertiseDeviceService(service)),
    ]).then(() => this);
  }

  get connectionInfo() {
    return {
      adminService: {
        port: this.adminService && this.adminService.port,
      },
      deviceService: {
        publicAddresses: DeviceService.publicAddresses,
        httpPort: this.deviceService && this.deviceService.httpPort,
        httpsPort: this.deviceService && this.deviceService.httpsPort,
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
    if (this.resolverService) {
      promises.push(this.resolverService.stop());
    }
    this.stopAdvertisements();
    return Promise.all(promises);
  }

  advertiseDeviceService(deviceService) {
    const serviceType = { name: 'nc-server-6', protocol: 'tcp' };
    try {
      if (!mdnsIsSupported) {
        return;
      }
      if (this.deviceAdvertisement) {
        this.deviceAdvertisement.stop();
      }
      this.deviceAdvertisement = mdns.createAdvertisement(
        serviceType,
        deviceService.httpPort,
        { name: os.hostname() },
      );
      this.deviceAdvertisement.start();
      logger.info(`MDNS: advertising ${JSON.stringify(serviceType)} on ${deviceService.httpPort}`);
    } catch (err) {
      logger.warn('MDNS unavailable');
      logger.warn(err);
    }
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
      publicAddresses: this.connectionInfo.deviceService.publicAddresses,
      deviceApiPort: this.connectionInfo.deviceService.httpPort,
      uptime: new Date().getTime() - this.started,
    };
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
