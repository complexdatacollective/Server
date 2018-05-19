/* eslint-env jest */
const { DeviceService, deviceServiceEvents } = require('../DeviceService');

jest.mock('../PairingRequestService');
jest.mock('../DeviceAPI');

const mockPairingCode = '123';

describe('Device Service', () => {
  let deviceService;

  beforeEach(() => {
    deviceService = new DeviceService({});
    deviceService.emit = jest.fn();
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
});
