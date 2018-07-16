/* eslint-env jest */
const { ipcMain } = require('electron');
const { emittedEvents, outOfBandDelegate } = require('../OutOfBandDelegate');
const { ErrorMessages } = require('../../../errors/IncompletePairingError');

const guiProxy = require('../../../guiProxy');

jest.mock('../../../guiProxy');

const pairingCode = '123';

describe('outOfBandDelegate', () => {
  afterEach(() => {
    guiProxy.sendToGui.mockReset();
  });

  it('notifies the GUI when a new PIN is created (for out-of-band transfer)', () => {
    guiProxy.sendToGui.mockReturnValue(true);
    outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode });
    expect(guiProxy.sendToGui)
      .toHaveBeenCalledWith(emittedEvents.PAIRING_CODE_AVAILABLE, { pairingCode });
  });

  it('warns when proxy window is unavilable', () => {
    guiProxy.sendToGui.mockReturnValue(false);
    const result = outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode });
    expect(result.promise).rejects.toMatchErrorMessage(ErrorMessages.PairingGuiUnavailable);
  });

  it('emits an event when pairing is complete', () => {
    outOfBandDelegate.pairingDidComplete();
    expect(guiProxy.sendToGui).toHaveBeenCalledWith(emittedEvents.PAIRING_COMPLETE);
  });

  describe('IPC', () => {
    beforeEach(() => {
      guiProxy.sendToGui.mockReturnValue(true);
      ipcMain.removeListener = jest.fn();
      ipcMain.once.mockReset();
      ipcMain.removeListener.mockClear();
    });

    it('resolves with the pairing request when acknowledged', () => {
      ipcMain.once.mockImplementation((channel, cb) => {
        if (channel === 'PairingCodeAcknowledged') { cb(); }
      });
      const res = outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode });
      expect(res.promise).resolves.toMatchObject({ pairingCode });
      expect(ipcMain.removeListener).toHaveBeenCalledTimes(2);
    });

    it('rejects when dismissed', () => {
      ipcMain.once.mockImplementation((channel, cb) => {
        if (channel === 'PairingCodeDismissed') { cb(); }
      });
      const res = outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode });
      expect(res.promise).rejects.toMatchErrorMessage(ErrorMessages.PairingCancelledByUser);
      expect(ipcMain.removeListener).toHaveBeenCalledTimes(2);
    });

    it('rejects on timeout', () => {
      jest.useFakeTimers();
      const res = outOfBandDelegate.pairingDidBeginWithRequest({ pairingCode });
      jest.runAllTimers();
      expect(res.promise).rejects.toMatchErrorMessage(ErrorMessages.PairingRequestTimedOut);
      expect(ipcMain.removeListener).toHaveBeenCalledTimes(2);
    });
  });
});
