/* eslint-env jest */
const mdns = require('mdns');
const os = require('os');

const Server = require('../Server');
const { DeviceService } = require('../devices/DeviceService');

const testPortNumber = 51999;
const serverOpts = { dataDir: 'db' };

jest.mock('electron-log');
jest.mock('mdns');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');

describe('Server', () => {
  let mockAdvert;
  let server;

  beforeEach(() => {
    mockAdvert = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    mdns.createAdvertisement.mockReturnValue(mockAdvert);
  });

  describe('running services', () => {
    beforeEach(() => {
      server = new Server(serverOpts);
    });
    afterEach(() => server.close());

    it('starts services', async () => {
      await server.startServices(testPortNumber);
      expect(server.deviceService).toBeDefined();
      expect(server.adminService).toBeDefined();
    });
  });

  it('starts services', () => {
    server = new Server(serverOpts);
    expect(server.status()).toMatchObject({});
  });


  describe('with a device service', () => {
    let deviceService;

    beforeEach((done) => {
      server = new Server();
      deviceService = new DeviceService({});
      deviceService.start().then(() => done());
    });

    afterEach(() => deviceService.stop());

    it('advertises using MDNS', () => {
      expect(mockAdvert.start.mock.calls.length).toBe(0);
      server.advertiseDeviceService(deviceService);
      expect(mockAdvert.start.mock.calls.length).toBe(1);
    });

    it('advertises hostname as instance name', () => {
      server.advertiseDeviceService(deviceService);
      const call = mdns.createAdvertisement.mock.calls[0];
      const optsArg = call[2];
      expect(optsArg).toMatchObject({ name: os.hostname() });
    });

    it('returns connection info', () => {
      expect(server.connectionInfo).toMatchObject({ deviceService: expect.any(Object) });
    });
  });
});
