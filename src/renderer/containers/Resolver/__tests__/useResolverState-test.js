/* eslint-env jest */

import { resolutionsReducer, matchesReducer } from '../useResolverState';

const getAction = (match, action, attributes) => ({
  payload: {
    match: match || { nodes: ['1234', '5678'], index: 0 },
    action: action || 'skip',
    attributes: attributes || {},
  },
});

describe('useResolverState', () => {
  describe('matchesReducer', () => {
    const initialState = [
      {
        index: 0,
        action: 'skip',
      },
      {
        index: 1,
        action: 'resolve',
      },
      {
        index: 2,
        action: 'skip',
      },
    ];

    it('Skip appends new matches', () => {
      const skipMatchAction = getAction(
        { nodes: [], index: 3 },
        'resolve',
      );

      const expectedResult = [
        ...initialState,
        {
          index: 3,
          action: 'resolve',
        },
      ];

      const subject = matchesReducer(initialState, skipMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('Skip deletes prior matches', () => {
      const skipMatchAction = getAction(
        { nodes: [], index: 1 },
        'skip',
      );

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 1,
          action: 'skip',
        },
      ];

      const subject = matchesReducer(initialState, skipMatchAction);

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve appends matches', () => {
      const skipResolutionAction = getAction(
        { nodes: [], index: 3 },
        'resolve',
      );

      const subject = matchesReducer(initialState, skipResolutionAction);

      const expectedResult = [
        ...initialState,
        {
          index: 3,
          action: 'resolve',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve deletes prior matches', () => {
      const skipMatchAction = getAction(
        { nodes: [], index: 1 },
        'resolve',
      );

      const subject = matchesReducer(initialState, skipMatchAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          index: 1,
          action: 'resolve',
        },
      ];

      expect(subject).toEqual(expectedResult);
    });
  });

  describe('resolutionsReducer', () => {
    const initialState = [
      {
        matchIndex: 0,
        nodes: ['a', 'b'],
        attributes: {},
      },
      {
        matchIndex: 1,
        nodes: ['c', 'd'],
        attributes: {},
      },
      {
        matchIndex: 2,
        nodes: ['e', 'f'],
        attributes: {},
      },
    ];

    it('Skip deletes prior resolutions', () => {
      const skipResolutionAction = getAction(
        { nodes: ['1234', '5678'], index: 1 },
        'skip',
        {},
      );

      const subject = resolutionsReducer(initialState, skipResolutionAction);

      expect(subject).toEqual(initialState.slice(0, 1));
    });

    it('Resolve appends resolutions', () => {
      const skipResolutionAction = getAction(
        { nodes: ['1234', '5678'], index: 3 },
        'resolve',
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, skipResolutionAction);

      const expectedResult = [
        ...initialState,
        {
          matchIndex: 3,
          nodes: ['1234', '5678'],
          attributes: { foo: 'bar' },
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve deletes prior resolutions', () => {
      const skipResolutionAction = getAction(
        { nodes: ['1234', '5678'], index: 1 },
        'resolve',
        { foo: 'bar' },
      );

      const subject = resolutionsReducer(initialState, skipResolutionAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          matchIndex: 1,
          nodes: ['1234', '5678'],
          attributes: { foo: 'bar' },
        },
      ];

      expect(subject).toEqual(expectedResult);
    });

    it('Resolve combines prior node references', () => {
      const skipResolutionAction = getAction(
        { nodes: ['d', 'f'], index: 1 },
        'resolve',
        {},
      );

      const subject = resolutionsReducer(initialState, skipResolutionAction);

      const expectedResult = [
        ...initialState.slice(0, 1),
        {
          matchIndex: 1,
          nodes: ['c', 'd', 'e', 'f'],
          attributes: {},
        },
      ];

      expect(subject).toEqual(expectedResult);
    });
  });
});
