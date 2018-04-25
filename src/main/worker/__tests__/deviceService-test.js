/* eslint-env jest */
const { DeviceService } = require('../deviceService');

jest.mock('../pairingRequestService');
jest.mock('../DeviceAPI');

const mockPairingCode = '123';

describe('Device Service', () => {
  let deviceService;

  beforeEach(() => {
    deviceService = new DeviceService({});
    deviceService.messageParent = jest.fn();
  });

  it('notifies the main process when a new PIN is created (for out-of-band transfer)', (done) => {
    deviceService.messageParent.mockImplementation((msg) => {
      expect(msg).toMatchObject({ data: { pairingCode: mockPairingCode } });
      done();
    });
    deviceService.outOfBandDelegate.pairingDidBeginWithCode('123');
  });

  it('notifies the main process when pairing is complete', (done) => {
    deviceService.messageParent.mockImplementation((msg) => {
      expect(msg).toMatchObject({ data: { pairingCode: mockPairingCode } });
      done();
    });
    deviceService.outOfBandDelegate.pairingDidCompleteWithCode(mockPairingCode);
  });
});
