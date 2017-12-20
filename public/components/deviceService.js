/* eslint-disable class-methods-use-this */
const cote = require('cote');

const devicePublisher = new cote.Publisher({
  name: 'devicePub',
  namespace: 'device',
  broadcasts: ['unpairedDevice']
});

const deviceResponder = new cote.Responder({
  name: 'deviceResp',
  namespace: 'device',
  respondsTo: ['deviceDiscoveryRequest', 'pairingRequest'], // types of requests this responder
  // can respond to.
});

class DeviceService {
  constructor(serverOptions) {
    this.devicePublisher = devicePublisher;
    this.deviceResponder = deviceResponder;
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
    deviceResponder.on('discoveryRequest', (req, cb) => {
      console.log(req);
      const resp = {
        randNum: Math.random() * 10,
        publicKey: serverOptions.keys.publicKey,
      };
      console.log('request', req.deviceName, 'answering with', resp);
      cb(resp);
    });

    // Device -> Server Pairing Service
    deviceResponder.on('pairingRequest', (req, cb) => {
      console.log(req);
      const resp = {
        pairingPin: this.generatePairingPin()
      };
      console.log('request', req.deviceName, 'answering with', resp);
      cb(resp);
    });
  }

  generatePairingPin() {
    return Math.floor(1000 + Math.random() * 9999);
  }

}

module.exports = DeviceService;

