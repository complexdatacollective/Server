/* eslint-env jest */
import reducer, { actionCreators, actionTypes, selectors } from '../excludedChartVariables';

jest.mock('../../../utils/adminApiClient');
jest.mock('../protocols', () => ({
  selectors: {
    currentProtocol: jest.fn().mockReturnValue({ id: '1' }),
  },
}));

describe('excludedChartVariables', () => {
  describe('reducer', () => {
    it('returns an empty initial state', () => {
      expect(reducer({})).toEqual({});
    });

    it('partitons state by protocol ID', () => {
      const action = {
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        protocolId: 'protocol1',
        section: 'person',
        variables: ['someVar'],
      };
      expect(reducer({}, action)).toHaveProperty('protocol1');
    });

    it('returns current state if no protocol ID given', () => {
      const action = {
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        section: 'person',
        variables: ['someVar'],
      };
      expect(reducer({}, action)).toEqual({});
    });

    it('returns a new state with excluded variables', () => {
      const action = {
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        protocolId: '1',
        section: 'person',
        variables: ['someVar'],
      };
      expect(reducer({}, action)).toEqual({
        1: { person: ['someVar'] },
      });
    });
  });

  describe('setExcludedVariables action creator', () => {
    it('produces an exclude action', () => {
      const action = actionCreators.setExcludedVariables('1', 'person', ['someVar']);
      expect(action).toEqual({
        type: actionTypes.SET_EXCLUDED_VARIABLES,
        protocolId: '1',
        section: 'person',
        variables: ['someVar'],
      });
    });
  });

  describe('excludedVariablesForCurrentProtocol selector', () => {
    const { excludedVariablesForCurrentProtocol } = selectors;
    it('returns variables for the protocol', () => {
      const excludedChartVariables = { 1: { person: ['someVar'] } };
      const state = { protocols: [{ id: '1' }], excludedChartVariables };
      const props = { match: { params: { id: '1' } } };
      expect(excludedVariablesForCurrentProtocol(state, props)).toEqual({ person: ['someVar'] });
    });
  });
});

