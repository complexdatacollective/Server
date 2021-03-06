/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
const DeviceDB = require('../DeviceDB');

const mockSecretHex = 'd7ff85d1ce04a59d848a87945f341c06323f7f9a356b5ac982c15481e0117fdc';

describe('the DeviceManager', () => {
  let dbClient;

  beforeEach((done) => {
    dbClient = new DeviceDB(null, { inMemoryOnly: true });
    dbClient.db.remove({}, { multi: true }, done);
  });

  it('creates a new device', async () => {
    const doc = await dbClient.createWithSecretAndName(mockSecretHex);
    expect(doc).toHaveProperty('_id');
  });

  it('loads all devices', async () => {
    await dbClient.createWithSecretAndName(mockSecretHex);
    const devices = await dbClient.all();
    expect(devices).toBeInstanceOf(Array);
    expect(devices).toHaveLength(1);
  });

  it('removes all devices, and returns removed count', async () => {
    await dbClient.createWithSecretAndName(mockSecretHex);
    const numRemoved = await dbClient.destroyAll();
    expect(numRemoved).toBe(1);
    expect(await dbClient.all()).toHaveLength(0);
  });

  it('removes one device, and returns removed count', async () => {
    const device = await dbClient.createWithSecretAndName(mockSecretHex);
    const numRemoved = await dbClient.destroy(device._id);
    expect(numRemoved).toBe(1);
    expect(await dbClient.all()).toHaveLength(0);
  });

  it('requires an ID for deletion', async () => {
    expect(dbClient.destroy()).rejects.toMatchErrorMessage('Cannot delete device without an id');
  });

  describe('when underlying db fails', () => {
    const mockError = new Error('database error');
    beforeEach(() => {
      dbClient.db.insert = jest.fn((...args) => args[args.length - 1](mockError));
      dbClient.db.remove = jest.fn((...args) => args[args.length - 1](mockError));
    });

    it('rejects a create', async () => {
      await expect(dbClient.createWithSecretAndName(mockSecretHex)).rejects.toThrow(mockError);
    });

    it('rejects a destroy', async () => {
      await expect(dbClient.destroyAll()).rejects.toThrow(mockError);
    });
  });
});
