/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../appMessages';

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

    it('exports a show creator', () => {
      expect(actionCreators.showMessage('testing')).toMatchObject({
        type: actionTypes.SHOW_MESSAGE,
        text: 'testing',
      });
    });
  });
});