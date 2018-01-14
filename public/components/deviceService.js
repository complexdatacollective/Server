/* eslint-disable class-methods-use-this */
const cote = require('cote');

class DeviceService {
  constructor(serverOptions) {
    this.devicePublisher = new cote.Publisher({
      name: 'devicePub',
      namespace: 'device',
      broadcasts: ['unpairedDevice']
    });

    this.deviceResponder = new cote.Responder({
      name: 'deviceResp',
      namespace: 'device',
      respondsTo: ['deviceDiscoveryRequest', 'pairingRequest'], // types of requests this responder
      // can respond to.
    });

    // Device -> Server Discovery Service
    this.deviceResponder.on('deviceDiscoveryRequest', (req, cb) => {
      console.log(req);
      const resp = {
        publicKey: serverOptions.keys.publicKey,
      };

      console.log('request', req.deviceName, 'answering with', resp);
      this.devicePublisher.publish('unpairedDevice', 1);
      cb(resp);
    });

    // Device -> Server Pairing Service
    this.deviceResponder.on('pairingRequest', (req, cb) => {
      console.log(req);
      const resp = {
        pairingPin: this.generatePairingPin()
      };
      console.log('request', req.deviceName, 'answering with', resp);
      cb(resp);
    });
  }

  generatePairingPin() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  stop() {
    this.devicePublisher.close();
    this.deviceResponder.close();
  }
}

module.exports = DeviceService;

