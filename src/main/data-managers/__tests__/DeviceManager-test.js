/* eslint-env jest */
const DeviceManager = require('../DeviceManager');

const mockSecretHex = 'd7ff85d1ce04a59d848a87945f341c06323f7f9a356b5ac982c15481e0117fdc';

jest.mock('../DeviceDB');

describe('the DeviceManager', () => {
  let deviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManager('.');
  });

  it('creates a new device', () => {
    deviceManager.createDeviceDocument(mockSecretHex);
    expect(deviceManager.db.createWithSecretAndName).toHaveBeenCalledWith(mockSecretHex, undefined);
  });

  it('returns existence (not found)', async () => {
    deviceManager.db.get.mockResolvedValue(null);
    expect(await deviceManager.exists('notfound')).toBe(false);
  });

  it('returns existence (found)', async () => {
    deviceManager.db.get.mockResolvedValue({});
    expect(await deviceManager.exists('notfound')).toBe(true);
  });

  it('creates a new device with a name', () => {
    const mockName = 'myDevice';
    deviceManager.createDeviceDocument(mockSecretHex, mockName);
    expect(deviceManager.db.createWithSecretAndName).toHaveBeenCalledWith(mockSecretHex, mockName);
  });

  it('will not create without a valid secret', async () => {
    await expect(deviceManager.createDeviceDocument(null)).rejects.toMatchObject({ message: 'Invalid input' });
  });

  it.skip('will not create with a short secret', () => {});

  describe('with stored devices', () => {
    it('loads all devices', () => {
      deviceManager.fetchDeviceList();
      expect(deviceManager.db.all).toHaveBeenCalled();
    });

    it('removes all devices', () => {
      deviceManager.destroyAllDevices();
      expect(deviceManager.db.destroyAll).toHaveBeenCalled();
    });

    it('removes a device', () => {
      deviceManager.destroy('someId');
      expect(deviceManager.db.destroy).toHaveBeenCalled();
    });
  });
});
