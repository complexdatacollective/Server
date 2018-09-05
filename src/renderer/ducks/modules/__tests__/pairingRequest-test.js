/* eslint-env jest */

import reducer, { actionCreators, actionTypes, PairingStatus, selectors } from '../pairingRequest';

const id = 'request1';
const pairingCode = 'abc123';

describe('the pairing request module', () => {
  describe('action creator', () => {
    it('exports a new action', () => {
      expect(actionCreators.newPairingRequest(id, pairingCode)).toEqual({
        type: actionTypes.NEW_PAIRING_REQUEST,
        pairingCode,
        id,
      });
    });

    it('exports a dismiss action', () => {
      expect(actionCreators.dismissPairingRequest()).toEqual({
        type: actionTypes.DISMISS_PAIRING_REQUEST,
      });
    });

    it('exports a complete action', () => {
      expect(actionCreators.completedPairingRequest()).toEqual({
        type: actionTypes.COMPLETED_PAIRING_REQUEST,
      });
    });

    it('exports an ack action', () => {
      expect(actionCreators.acknowledgePairingRequest()).toEqual({
        type: actionTypes.ACKNOWLEDGE_PAIRING_REQUEST,
      });
    });
  });

  describe('reducer', () => {
    it('has empty state by default', () => {
      expect(reducer(undefined)).toEqual({});
    });

    it('moves to the pending state', () => {
      const state = reducer(undefined, actionCreators.newPairingRequest(id, pairingCode));
      expect(state.status).toEqual(PairingStatus.Pending);
    });

    it('moves to the acknowledged state', () => {
      const state = reducer(undefined, actionCreators.acknowledgePairingRequest());
      expect(state.status).toEqual(PairingStatus.Acknowledged);
    });

    it('moves to the completed state', () => {
      const initialState = actionCreators.acknowledgePairingRequest();
      const state = reducer(initialState, actionCreators.completedPairingRequest(pairingCode));
      expect(state.status).toEqual(PairingStatus.Complete);
      expect(state.pairingCode).toBeUndefined();
    });

    it('handles dissmissing', () => {
      const initialState = actionCreators.newPairingRequest(id, pairingCode);
      const state = reducer(initialState, actionCreators.dismissPairingRequest());
      expect(state.status).toBeUndefined();
      expect(state.pairingCode).toBeUndefined();
    });
  });

  describe('requestIsPending selector', () => {
    it('returns true when request is pending', () => {
      const state = { pairingRequest: { status: PairingStatus.Pending } };
      expect(selectors.requestIsPending(state)).toBe(true);
    });

    it('returns flase when no request is pending', () => {
      const state = { pairingRequest: {} };
      expect(selectors.requestIsPending(state)).toBe(false);
    });
  });
});
