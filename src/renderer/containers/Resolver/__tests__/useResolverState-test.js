/* eslint-env jest */

import { resolutionsReducer, matchActionReducer, actionCreators } from '../useResolverState';
import Factory from './factory';

describe('useResolverState', () => {
  describe('matchActionReducer', () => {
    const initialState = Factory.buildList('matchEntry', 3);

    it('Skip appends new matches', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 100 }),
        'skip',
      );

      const expectedResult = [
        {
          index: 100,
          action: 'skip',
        },
      ];

      const subject = matchActionReducer([], resolveMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('Skip deletes match entries beyond the match index', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 2 }),
        'skip',
      );

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'skip',
        },
      ];

      const subject = matchActionReducer(initialState, resolveMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve appends new matches', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 100 }),
        'resolve',
      );

      const subject = matchActionReducer([], resolveMatchAction);

      const expectedResult = [
        {
          index: 100,
          action: 'resolve',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve deletes match entries beyond the match index', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 2 }),
        'resolve',
      );

      const subject = matchActionReducer(initialState, resolveMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 2,
          action: 'resolve',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });
  });

  describe('resolutionsReducer', () => {
    const initialState = Factory.buildList('resolutionEntry', 3);
    it('Skip deletes resolutions beyond and including the match index', () => {
      const resolveMatchAction = actionCreators.resolveMatch(
        Factory.build('match', { index: 2 }),
        'skip',
      );

      const subject = resolutionsReducer(initialState, resolveMatchAction);

      expect(subject).toEqual(initialState.slice(0, 1));
    });

    it('Resolve appends new resolutions', () => {
      const match = Factory.build('match', { index: 100 });
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        'resolve',
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

    it('Resolve deletes resolutions beyond the match index', () => {
      const nodeIds = ['abc', 'def'];
      const match = Factory.build('match', { index: 2, nodes: nodeIds.map(id => ({ id })) });
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        'resolve',
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

    it('Resolve combines prior node references', () => {
      const nodesForExistingEntries = [['a', 'b'], ['c', 'd'], ['e', 'f']];
      const combineInitialState = nodesForExistingEntries.map(nodes =>
        Factory.build('resolutionEntry', { nodes }),
      );

      const nodeIds = ['d', 'f'];

      const match = Factory.build('match', { index: 100, nodes: nodeIds.map(id => ({ id })) });
      const resolveMatchAction = actionCreators.resolveMatch(
        match,
        'resolve',
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
