/* eslint-env jest */

import { properties } from '../../../../main/utils/resolver/helpers';
import { reduceResolutions as resolutionsReducer, reduceActions as getMatchActionReducer, actionCreators } from '../useResolutionsState';
import Factory from '../__factories__';

describe('useResolutionsState', () => {
  describe('matchActionReducer', () => {
    const initialState = Factory.matchEntry.buildList(3);
    const matchActionReducer = getMatchActionReducer([]);

    it('SKIP appends new matches', () => {
      const skipMatchAction = actionCreators.skipMatch(
        Factory.match.build({ index: 100 }),
      );

      const expectedResult = [
        {
          index: 100,
          action: 'skip',
        },
      ];

      const { actions } = matchActionReducer({ actions: [], resolutions: [] }, skipMatchAction);

      expect(actions).toEqual(expectedResult);
    });

    it('SKIP deletes match entries beyond the match index', () => {
      const skipMatchAction = actionCreators.skipMatch(
        Factory.match.build({ index: 2 }),
      );

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'skip',
        },
      ];

      const { actions } = matchActionReducer({
        actions: initialState,
        resolutions: [],
      }, skipMatchAction);

      expect(actions).toEqual(expectedResult);
    });

    it('RESOLVE appends new matches', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.match.build({ index: 100 }),
      );

      const { actions } = matchActionReducer({
        actions: [],
        resolutions: [],
      }, resolveMatchAction);

      const expectedResult = [
        {
          index: 100,
          action: 'match',
        },
      ];

      expect(actions).toEqual(expectedResult);
    });

    it('RESOLVE deletes match entries beyond the match index', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.match.build({ index: 2 }),
      );

      const { actions } = matchActionReducer({
        actions: initialState,
        resolutions: [],
      }, resolveMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'match',
        },
      ];

      expect(actions).toEqual(expectedResult);
    });
  });

  describe('resolutionsReducer', () => {
    const initialState = Factory.resolutionEntry.buildList(3);

    it('SKIP deletes resolutions beyond and including the match index', () => {
      const match = Factory.match.build({ index: 2 });
      const skipMatchAction = actionCreators.skipMatch(match);

      const subject = resolutionsReducer(initialState, skipMatchAction);

      expect(subject).toEqual(initialState.slice(0, 1));
    });

    it('RESOLVE appends new resolutions', () => {
      const match = Factory.match.build({ index: 100 });
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState,
        expect.objectContaining({
          matchIndex: 100,
          nodes: match.nodes.map(({ _uid }) => _uid),
          attributes: { foo: 'bar' },
        }),
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE deletes resolutions beyond the match index', () => {
      const nodeIds = ['abc', 'def'];
      const match = Factory.match.build(
        { index: 2, nodes: nodeIds.map((id) => ({ [properties.nodePrimaryKey]: id })) },
      );

      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        expect.objectContaining({
          matchIndex: 2,
          nodes: nodeIds,
          attributes: { foo: 'bar' },
        }),
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE combines prior node references', () => {
      const nodesForExistingEntries = [['a', 'b'], ['c', 'd'], ['e', 'f']];
      const combineInitialState = nodesForExistingEntries.map((
        nodes,
      ) => Factory.resolutionEntry.build({ nodes }));

      const nodeIds = ['d', 'f'];

      const match = Factory.match.build(
        { index: 100, nodes: nodeIds.map((id) => ({ [properties.nodePrimaryKey]: id })) },
      );

      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(combineInitialState, resolveMatchAction);

      const expectedResult = [
        ...combineInitialState,
        expect.objectContaining({
          matchIndex: 100,
          nodes: ['c', 'd', 'e', 'f'],
          attributes: { foo: 'bar' },
        }),
      ];

      expect(subject).toEqual(expectedResult);
    });
  });
});
