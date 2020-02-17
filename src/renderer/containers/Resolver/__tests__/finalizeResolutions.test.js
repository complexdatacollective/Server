/* eslint-env jest */

import finalizeResolutions from '../finalizeResolutions';
import Factory from './factory';

const HISTORY = [
  ['a', 'b'],
  ['c', 'd'],
  ['a', 'b', 'c', 'd'],
  ['e', 'f'],
];

const getHistory = (matchIndex = 0) => HISTORY[matchIndex - 1];

describe('finalizeResolutions', () => {
  it('converts a list of historical resolutions in a list of end-changes', () => {
    const mockResolutions = Factory.buildList('resolution', 4, null, { getHistory });
    const subject = finalizeResolutions({ resolutions: mockResolutions });
    expect(subject).toBe(true);
  });
});
