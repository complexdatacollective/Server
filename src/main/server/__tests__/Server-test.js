/* eslint-env jest */
/* eslint-disable global-require */

/**
 * This suite only requires inside test contexts and makes use of jest.resetModules()
 * in order to simulate MDNS dependency load failures from mdnsProvider.
 */

const os = require('os');

const { deviceServiceEvents } = require('../devices/DeviceService');

const testPortNumber = 51999;
const serverOpts = { dataDir: 'db-6' };
const mockDeviceService = { on: jest.fn(), stop: jest.fn() };

jest.mock('electron-log');
jest.mock('mdns');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');

describe('Server', () => {
  let mdnsProvider;
  let Server;
  let mockAdvert;
  let server;

  beforeAll(() => {
    jest.resetModules();
    Server = require('../Server');
    mdnsProvider = require('../mdnsProvider');
  });

  beforeEach(() => {
    mockAdvert = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    mdnsProvider.mdns.createAdvertisement.mockReturnValue(mockAdvert);
    mockDeviceService.on.mockClear();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('running services', () => {
    beforeEach(() => {
      server = new Server(serverOpts);
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
    server.deviceService = mockDeviceService;
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
    server.deviceService = mockDeviceService;
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
      const { DeviceService } = require('../devices/DeviceService');
      server = new Server();
      mockAdvert = {
        start: jest.fn(),
        stop: jest.fn(),
        on: jest.fn(),
      };
      mdnsProvider.mdns.createAdvertisement.mockReturnValue(mockAdvert);
      deviceService = new DeviceService({});
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
      const call = mdnsProvider.mdns.createAdvertisement.mock.calls[0];
      const optsArg = call[2];
      expect(optsArg).toMatchObject({ name: os.hostname() });
    });

    it('returns connection info', () => {
      expect(server.connectionInfo).toMatchObject({ deviceService: expect.any(Object) });
    });
  });
});

describe('Server when MDNS unavailable', () => {
  let Server;
  let server;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('../mdnsProvider', () => ({
      mdns: null,
      mdnsIsSupported: false,
    }));
    Server = require('../Server');
  });

  describe('when MDNS unavailable', () => {
    beforeEach(() => {
      server = new Server(serverOpts);
    });

    afterEach(async () => {
      await server.close();
    });

    it('does not start advertisements', async () => {
      await server.advertiseDeviceService({});
      expect(server.deviceAdvertisement).not.toBeDefined();
    });

    it('sets status appropriately', async () => {
      await server.advertiseDeviceService({});
      expect(server.status().mdnsIsSupported).toBe(false);
      expect(server.status().isAdvertising).toBe(false);
    });
  });
});
