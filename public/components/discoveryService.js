const cote = require('cote');

class DiscoveryService {
  constructor(serverOptions) {
    console.log(serverOptions);
    const discoveryResponder = new cote.Responder({
      name: 'discoveryRep',
      respondsTo: ['discoveryRequest', 'promised request'], // types of requests this responder
      // can respond to.
    });

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

