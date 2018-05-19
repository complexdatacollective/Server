/* eslint-env jest */
import { ipcRenderer } from 'electron';

import pairingObserver from '../pairing-observer';
import { actionTypes } from '../../modules/pairingRequest';
import { actionTypes as protocolActions } from '../../modules/protocols';

jest.mock('electron');

describe('the pairing-observer middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('implements the middleware chain', () => {
    pairingObserver()(next)(actionTypes.ACKNOWLEDGE_PAIRING_REQUEST);
    expect(next).toHaveBeenCalled();
  });

  it('sends ipc for pairing acknowledgement', () => {
    pairingObserver()(next)({ type: actionTypes.ACKNOWLEDGE_PAIRING_REQUEST });
    expect(ipcRenderer.send).toHaveBeenCalled();
  });

  it('sends ipc for pairing dismissal', () => {
    pairingObserver()(next)({ type: actionTypes.DISMISS_PAIRING_REQUEST });
    expect(ipcRenderer.send).toHaveBeenCalled();
  });

  it('ignores other action types', () => {
    pairingObserver()(next)({ type: protocolActions.LOAD_PROTOCOLS });
    expect(ipcRenderer.send).not.toHaveBeenCalled();
  });
});
