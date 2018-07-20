/* eslint-env jest */
const { DeviceService } = require('../DeviceService');
const { apiEvents } = require('../DeviceAPI');

jest.mock('electron-log');
jest.mock('../PairingRequestService');
jest.mock('../DeviceAPI');

describe('Device Service', () => {
  let deviceService;

  beforeEach(() => {
    deviceService = new DeviceService({});
    deviceService.emit = jest.fn();
    deviceService.api.on.mockClear();
  });

  it('delegates session import event to API', () => {
    const listener = jest.fn();
    const evtName = apiEvents.SESSIONS_IMPORTED;
    deviceService.on(evtName, listener);
    expect(deviceService.api.on).toHaveBeenCalledWith(evtName, listener);
  });

  it('ignores other events', () => {
    deviceService.on('not-an-event', jest.fn());
    expect(deviceService.api.on).not.toHaveBeenCalled();
  });

  describe('API', () => {
    beforeEach(() => {
      deviceService.api.listen.mockResolvedValue({});
    });

    it('starts the API on a default port', () => {
      deviceService.start();
      expect(deviceService.api.listen).toHaveBeenCalledWith(expect.any(Number));
    });

    it('ensures API is given a number for port', () => {
      deviceService.start('9999');
      expect(deviceService.api.listen).toHaveBeenCalledWith(9999);
    });
  });
});
