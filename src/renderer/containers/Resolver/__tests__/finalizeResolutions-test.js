/* eslint-env jest */

import finalizeResolutions from '../finalizeResolutions';
import Factory from './factory';

const HISTORY = [
  { nodes: ['a', 'b'], attributes: { foo: 'bar' } },
  { nodes: ['c', 'd'], attributes: { bazz: 'buzz' } },
  { nodes: ['a', 'b', 'c', 'd'], attributes: { fizz: 'pop' } },
  { nodes: ['e', 'f'], attributes: { bar: 'bazz' } },
];

describe('finalizeResolutions', () => {
  it('converts a list of historical resolutions in a list of end-changes', () => {
    const mockDraftResolutions = HISTORY.map(item => Factory.build('resolutionEntry', item));
    const subject = finalizeResolutions(mockDraftResolutions);
    expect(subject.length).toBe(2);
    expect(subject[0]).toMatchObject(HISTORY[2]);
    expect(subject[1]).toMatchObject(HISTORY[3]);
  });
});
