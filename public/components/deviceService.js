/* eslint-disable class-methods-use-this */
const cote = require('cote');

const devicePublisher = new cote.Publisher({
  name: 'discoveryPub',
  namespace: 'disc',
  broadcasts: ['unpairedDevice']
});

const deviceResponder = new cote.Responder({
  name: 'discoveryRep',
  namespace: 'disc',
  respondsTo: ['discoveryRequest', 'pairingRequest'], // types of requests this responder
  // can respond to.
});

class DeviceService {
  constructor(serverOptions) {
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

    // Device -> Server Discovery Service
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

