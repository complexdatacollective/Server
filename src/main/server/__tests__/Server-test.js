/* eslint-env jest */
const mdns = require('mdns');
const os = require('os');

const Server = require('../Server');
const { DeviceService, deviceServiceEvents } = require('../devices/DeviceService');

const testPortNumber = 51999;
const serverOpts = { dataDir: 'db', keys: {} };

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
    afterEach(async () => {
      await server.close();
    });

    it('starts services', async () => {
      await server.startServices(testPortNumber);
      expect(server.deviceService).toBeDefined();
      expect(server.adminService).toBeDefined();
    });
  });

  it('provides a status object', () => {
    server = new Server(serverOpts);
    expect(server.status()).toMatchObject({});
  });

  it('forwards pairing request events from device service', () => {
    const handler = jest.fn();
    const evtName = deviceServiceEvents.PAIRING_CODE_AVAILABLE;
    server = new Server(serverOpts);
    server.deviceService = { on: jest.fn() };
    server.on(evtName, handler);
    expect(server.deviceService.on).toHaveBeenCalledWith(evtName, handler);
  });

  it('registers to hear pairing request events', async () => {
    server = new Server(serverOpts);
    await server.startServices(testPortNumber);
    server.on('PAIRING_CODE_AVAILABLE', jest.fn());
    await server.close();
    expect(server.deviceService.eventNames()).toContain('PAIRING_CODE_AVAILABLE');
  });

  it('ignores non-device events', () => {
    server = new Server(serverOpts);
    server.deviceService = { on: jest.fn() };
    server.on('not-a-real-event');
    expect(server.deviceService.on).not.toHaveBeenCalled();
  });

  it('handles spurious closing gracefully', async () => {
    server = new Server(serverOpts);
    const promises = await server.close();
    await server.close();
    expect(promises).toEqual([]);
  });

  describe('with a device service', () => {
    let deviceService;

    beforeEach(async () => {
      server = new Server();
      deviceService = new DeviceService({ keys: {} });
    });

    it('advertises using MDNS', () => {
      expect(mockAdvert.start.mock.calls.length).toBe(0);
      server.advertiseDeviceService(deviceService);
      expect(mockAdvert.start.mock.calls.length).toBe(1);
    });

    it('stops before re-advertising', () => {
      server.deviceAdvertisement = mockAdvert;
      expect(mockAdvert.stop.mock.calls.length).toBe(0);
      server.advertiseDeviceService(deviceService);
      expect(mockAdvert.stop.mock.calls.length).toBe(1);
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
