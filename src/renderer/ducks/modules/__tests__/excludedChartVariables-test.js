/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../excludedChartVariables';

jest.mock('../../../utils/adminApiClient');

describe('excludedChartVariables', () => {
  describe('reducer', () => {
    it('returns an empty initial state', () => {
      expect(reducer()).toEqual({});
    });

    it('returns a new state with excluded variables', () => {
      const action = {
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        section: 'person',
        variables: ['someVar'],
      };
      expect(reducer({}, action)).toEqual({
        person: ['someVar'],
      });
    });
  });

  describe('setExcludedVariables', () => {
    it('produces an exclude action', () => {
      const action = actionCreators.setExcludedVariables('person', ['someVar']);
      expect(action).toEqual({
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        section: 'person',
        variables: ['someVar'],
      });
    });
  });
});

