/* eslint-env jest */
import reducer, { actionCreators, actionTypes, messageTypes } from '../appMessages';

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
  });
});
