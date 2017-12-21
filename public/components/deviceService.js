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

    // setInterval(() => {
    //   const val = {
    //     unpairedDeviceCount: Math.floor(Math.random() * 2)
    //   };

    //   console.log('emitting', val);
    //   if (val.unpairedDeviceCount > 0) {
    //     discoveryPublisher.publish('unpairedDevice', val);
    //   }
    // }, 3000);

    // Device -> Server Discovery Service
    this.deviceResponder.on('discoveryRequest', (req, cb) => {
      console.log(req);
      const resp = {
        randNum: Math.random() * 10,
        publicKey: serverOptions.keys.publicKey,
      };
      console.log('request', req.deviceName, 'answering with', resp);
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
}

module.exports = DeviceService;

