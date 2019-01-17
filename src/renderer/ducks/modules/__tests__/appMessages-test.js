/* eslint-env jest */
import reducer, { actionCreators, actionTypes, messageTypes, messageLifetimeMillis } from '../appMessages';

jest.mock('../../../utils/adminApiClient');

describe('the appMessages module', () => {
  describe('reducer', () => {
    it('has empty state by default', () => {
      expect(reducer(undefined)).toEqual([]);
    });

    it('adds a shown message', () => {
      const msg = 'testing';
      const state = reducer(undefined, { type: actionTypes.SHOW_MESSAGE, text: msg });
      expect(state).toContainEqual(expect.objectContaining({ text: msg }));
    });

    it('dismisses messages', () => {
      const state = reducer([{ text: '' }], { type: actionTypes.DISMISS_MESSAGES });
      expect(state).toEqual([]);
    });

    it('dismisses one message', () => {
      const timestamp = 1;
      const state = reducer([{ text: '', timestamp }], { type: actionTypes.DISMISS_MESSAGE, messageTimestamp: timestamp });
      expect(state).toEqual([]);
    });

    it('marks expired messages', () => {
      const state = reducer([{ text: '', timestamp: 1 }], { type: actionTypes.UPDATE_MESSAGE_STATE });
      expect(state).toEqual([{ text: '', timestamp: 1, isExpired: true }]);
    });

    it('filters expired messages', () => {
      const state = reducer([{ text: '', isExpired: true }], { type: actionTypes.UPDATE_MESSAGE_STATE });
      expect(state).toEqual([]);
    });
  });

  describe('actionCreators', () => {
    it('exports a dismiss creator', () => {
      expect(actionCreators.dismissAppMessages()).toEqual({
        type: actionTypes.DISMISS_MESSAGES,
      });
    });

    it('exports a showErrorMessage thunk', () => {
      expect(actionCreators.showErrorMessage('testing')).toBeInstanceOf(Function);
    });

    it('exports a showConfirmationMessage thunk', () => {
      expect(actionCreators.showConfirmationMessage('testing')).toBeInstanceOf(Function);
    });

    it('dispatches an error message to show', () => {
      const dispatch = jest.fn();
      actionCreators.showErrorMessage('testing')(dispatch);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        messageType: messageTypes.Error,
        type: actionTypes.SHOW_MESSAGE,
        text: 'testing',
      }));
    });

    it('dispatches a confirmation message to show', () => {
      const dispatch = jest.fn();
      actionCreators.showConfirmationMessage('testing')(dispatch);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        messageType: messageTypes.Confirmation,
        type: actionTypes.SHOW_MESSAGE,
        text: 'testing',
      }));
    });

    it('schedules message expiration', () => {
      jest.useFakeTimers();
      const dispatch = jest.fn();
      actionCreators.showConfirmationMessage('testing')(dispatch);
      jest.advanceTimersByTime(messageLifetimeMillis);
      expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({
        type: actionTypes.UPDATE_MESSAGE_STATE,
      }));
    });
  });
});
