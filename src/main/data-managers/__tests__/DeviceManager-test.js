/* eslint-env jest */
const DeviceManager = require('../DeviceManager');

const mockSaltHex = 'daaa785631a9481b53b7d9d8434ea673';
const mockSecretHex = 'd7ff85d1ce04a59d848a87945f341c06323f7f9a356b5ac982c15481e0117fdc';

describe('the DeviceManager', () => {
  let deviceManager;

  beforeEach((done) => {
    deviceManager = new DeviceManager('.');
    deviceManager.db.remove({}, { multi: true }, done);
  });

  it('creates a new device', async () => {
    const doc = await deviceManager.createDeviceDocument(mockSecretHex);
    expect(doc).toHaveProperty('_id');
  });

  it('will not create without a valid secret', async () => {
    await expect(deviceManager.createDeviceDocument(null))
      .rejects.toBeInstanceOf(Error);
  });

  it('will not create with a short secret');

  it('loads all devices', async () => {
    await deviceManager.createDeviceDocument(mockSaltHex, mockSecretHex);
    const devices = await deviceManager.fetchDeviceList();
    expect(devices).toBeInstanceOf(Array);
    expect(devices).toHaveLength(1);
  });

  it('removes all devices, and returns removed count', async () => {
    await deviceManager.createDeviceDocument(mockSecretHex);
    const numRemoved = await deviceManager.destroyAllDevices();
    expect(numRemoved).toBe(1);
    expect(await deviceManager.fetchDeviceList()).toHaveLength(0);
  });
});
