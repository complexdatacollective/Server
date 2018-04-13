/* eslint-env jest */
const DeviceManager = require('../deviceManager');

const mockSaltHex = 'daaa785631a9481b53b7d9d8434ea673';
const mockSecretHex = 'd7ff85d1ce04a59d848a87945f341c06323f7f9a356b5ac982c15481e0117fdc';

describe('the DeviceManager', () => {
  let deviceManager;

  beforeEach((done) => {
    deviceManager = new DeviceManager('.');
    deviceManager.db.remove({}, { multi: true }, done);
  });

  it('creates a new device', (done) => {
    deviceManager.createDeviceDocument(mockSaltHex, mockSecretHex)
      .then(doc => expect(doc).toHaveProperty('_id'))
      .then(done);
  });

  it('will not create without a valid salt', async () => {
    await expect(deviceManager.createDeviceDocument(null, mockSecretHex))
      .rejects.toBeInstanceOf(Error);
  });

  it('will not create without a valid secret', async () => {
    await expect(deviceManager.createDeviceDocument(mockSaltHex))
      .rejects.toBeInstanceOf(Error);
  });

  it('will not create with a short secret');
  it('will not create with a short salt');

  it('loads all devices', (done) => {
    deviceManager.createDeviceDocument(mockSaltHex, mockSecretHex)
      .then(() => deviceManager.fetchDeviceList())
      .then((devices) => {
        expect(devices).toBeInstanceOf(Array);
        expect(devices.length).toBe(1);
      })
      .then(done);
  });
});
