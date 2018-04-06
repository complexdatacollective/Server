/* eslint-env jest */
const mdns = require('mdns');

const Server = require('../Server');
const { DeviceService } = require('../deviceService');

const testPortNumber = 51999;
const serverOpts = { dataDir: 'db' };

jest.mock('electron-log');
jest.mock('mdns');
jest.mock('../../data-managers/DeviceManager');

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

  it('starts services', (done) => {
    server = new Server(serverOpts);
    server.startServices(testPortNumber).then(() => {
      expect(server.deviceService).toBeDefined();
      expect(server.adminService).toBeDefined();
      server.close();
      done();
    });
  });

  describe('with a device service', () => {
    let deviceService;

    beforeEach((done) => {
      server = new Server();
      deviceService = new DeviceService({});
      deviceService.start()
        .then(done);
    });

    afterEach(() => deviceService.stop());

    it('advertises using MDNS', () => {
      expect(mockAdvert.start.mock.calls.length).toBe(0);
      server.advertiseDeviceService(deviceService);
      expect(mockAdvert.start.mock.calls.length).toBe(1);
    });

    it('returns connection info', () => {
      expect(server.connectionInfo).toMatchObject({ deviceService: expect.any(Object) });
    });
  });
});
