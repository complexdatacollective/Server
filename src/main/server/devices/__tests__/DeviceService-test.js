/* eslint-env jest */
const { DeviceService, deviceServiceEvents } = require('../DeviceService');
const { apiEvents } = require('../DeviceAPI');

jest.mock('electron-log');
jest.mock('../PairingRequestService');
jest.mock('../DeviceAPI');

const mockPairingCode = '123';

describe('Device Service', () => {
  let deviceService;

  beforeEach(() => {
    deviceService = new DeviceService({});
    deviceService.emit = jest.fn();
    deviceService.api.on.mockClear();
  });

  it('emits an event when a new PIN is created (for out-of-band transfer)', (done) => {
    deviceService.emit.mockImplementation((msg, data) => {
      expect(msg).toMatch(deviceServiceEvents.PAIRING_CODE_AVAILABLE);
      expect(data).toMatchObject({ pairingCode: mockPairingCode });
      done();
    });
    deviceService.outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode: mockPairingCode });
  });

  it('emits an event when pairing is complete', (done) => {
    deviceService.emit.mockImplementation((msg) => {
      expect(msg).toMatch(deviceServiceEvents.PAIRING_COMPLETE);
      done();
    });
    deviceService.outOfBandDelegate.pairingDidComplete();
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
});
