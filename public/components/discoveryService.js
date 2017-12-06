const cote = require('cote');

const discoveryPublisher = new cote.Publisher({
  name: 'discoveryPub',
  namespace: 'disc',
  broadcasts: ['unpairedDevice']
});

const discoveryResponder = new cote.Responder({
  name: 'discoveryRep',
  namespace: 'disc',
  respondsTo: ['discoveryRequest', 'promised request'], // types of requests this responder
  // can respond to.
});

class DiscoveryService {
  constructor(serverOptions) {
    setInterval(() => {
      const val = {
        unpairedDeviceCount: Math.floor(Math.random() * 2)
      };

      console.log('emitting', val);
      if (val.unpairedDeviceCount > 0) {
        discoveryPublisher.publish('unpairedDevice', val);
      }
    }, 3000);

    // Device -> Server Discovery Service
    discoveryResponder.on('discoveryRequest', (req, cb) => {
      console.log(req);
      const resp = {
        randNum: Math.random() * 10,
        publicKey: serverOptions.keys.publicKey,
      };
      console.log('request', req.deviceName, 'answering with', resp);
      cb(resp);
    });
  }
}

module.exports = DiscoveryService;

