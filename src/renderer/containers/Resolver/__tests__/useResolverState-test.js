/* eslint-env jest */

import { resolutionsReducer, matchActionReducer, actionCreators } from '../useResolverState';
import { nodePrimaryKeyProperty } from '../../../../main/utils/formatters/network';
import Factory from './factory';

describe('useResolverState', () => {
  describe('matchActionReducer', () => {
    const initialState = Factory.buildList('matchEntry', 3);

    it('SKIP appends new matches', () => {
      const skipMatchAction = actionCreators.skipMatch(
        Factory.build('match', { index: 100 }),
      );

      const expectedResult = [
        {
          index: 100,
          action: 'SKIP',
        },
      ];

      const subject = matchActionReducer([], skipMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('SKIP deletes match entries beyond the match index', () => {
      const skipMatchAction = actionCreators.skipMatch(
        Factory.build('match', { index: 2 }),
      );

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'SKIP',
        },
      ];

      const subject = matchActionReducer(initialState, skipMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE appends new matches', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 100 }),
      );

      const subject = matchActionReducer([], resolveMatchAction);

      const expectedResult = [
        {
          index: 100,
          action: 'RESOLVE',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE deletes match entries beyond the match index', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 2 }),
      );

      const subject = matchActionReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'RESOLVE',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });
  });

  describe('resolutionsReducer', () => {
    const initialState = Factory.buildList('resolutionEntry', 3);
    it('SKIP deletes resolutions beyond and including the match index', () => {
      const skipMatchAction = actionCreators.skipMatch(
        Factory.build('match', { index: 2 }),
      );

      const subject = resolutionsReducer(initialState, skipMatchAction);

      expect(subject).toEqual(initialState.slice(0, 1));
    });

    it('RESOLVE appends new resolutions', () => {
      const match = Factory.build('match', { index: 100 });
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState,
        {
          matchIndex: 100,
          nodes: match.nodes.map(({ _uid }) => _uid),
          attributes: { foo: 'bar' },
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE deletes resolutions beyond the match index', () => {
      const nodeIds = ['abc', 'def'];
      const match = Factory.build(
        'match',
        { index: 2, nodes: nodeIds.map(id => ({ [nodePrimaryKeyProperty]: id })) },
      );
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          matchIndex: 2,
          nodes: nodeIds,
          attributes: { foo: 'bar' },
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('RESOLVE combines prior node references', () => {
      const nodesForExistingEntries = [['a', 'b'], ['c', 'd'], ['e', 'f']];
      const combineInitialState = nodesForExistingEntries.map(nodes =>
        Factory.build('resolutionEntry', { nodes }),
      );

      const nodeIds = ['d', 'f'];

      const match = Factory.build(
        'match',
        { index: 100, nodes: nodeIds.map(id => ({ [nodePrimaryKeyProperty]: id })) },
      );
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(combineInitialState, resolveMatchAction);

      const expectedResult = [
        ...combineInitialState,
        {
          matchIndex: 100,
          nodes: ['c', 'd', 'e', 'f'],
          attributes: { foo: 'bar' },
        },
      ];

      expect(subject).toEqual(expectedResult);
    });
  });
});
