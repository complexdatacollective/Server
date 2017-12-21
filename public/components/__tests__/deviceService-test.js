/* eslint-env jest */
const { Requester } = require('cote');
const DeviceService = require('../deviceService');

describe('Device Service', () => {
  const serverOptions = {
    keys: {
      publicKey: 'test-public-key'
    }
  };
  const devicePairingReq = {
    type: 'pairingRequest',
    deviceName: 'device-name',
    protocol: 'protocol-name',
    reqDate: new Date(),
  };
  const deviceRequester = new Requester({ name: 'deviceRequester' });
  const deviceService = new DeviceService(serverOptions);

  it('It publishes unpaired devices');
  it('responds to pairing requests', (done) => {
    deviceRequester.send(devicePairingReq);

    deviceService.deviceResponder.on('pairingRequest', (req) => {
      expect(req).toHaveProperty([
        'deviceName',
        'protocol',
        'reqDate'
      ]);
    });

    done();
  });

  it('generates a random 4-digit pin', (done) => {
    const pin = deviceService.generatePairingPin();
    const numDigits = pin.toString().length;
    expect(pin).toBeGreaterThan(0);
    expect(numDigits).toEqual(4);
    done();
  });

  afterAll(() => {
    deviceRequester.close();
    deviceService.stop();
  });
});
