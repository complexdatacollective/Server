/* eslint-env jest */

import { getMatch, getMatchOrResolved } from '../selectors';

describe('selectors', () => {
  describe('getMatch', () => {
    const matches = [{ foo: 'bar' }, { bazz: 'buzz' }, { fizz: 'pop' }];

    it('gets match by index and returns match object including that index', () => {
      expect(getMatch(matches, 1)).toEqual({ bazz: 'buzz', index: 1 });
    });

    it('returns null if match is not found', () => {
      expect(getMatch(matches, 3)).toBe(null);
    });
  });

  describe('getMatchOrResolved', () => {
    const resolutions = [
      {
        nodes: [1, 2],
        attributes: { foo: 'fizz' },
      },
    ];

    const match = {
      nodes: [
        { _uid: 1, attributes: { foo: 'bar' } },
        { _uid: 3, attributes: { fizz: 'buzz' } },
      ],
    };

    it('returns latest resolution', () => {
      expect(getMatchOrResolved(match, resolutions))
        .toEqual({
          ...match,
          nodes: [
            { _uid: 1, attributes: { foo: 'fizz' } },
            { _uid: 3, attributes: { fizz: 'buzz' } },
          ],
        });
    });

    it('returns match if no resolution', () => {
      expect(getMatchOrResolved(match, []))
        .toEqual(match);
    });
  });
});
