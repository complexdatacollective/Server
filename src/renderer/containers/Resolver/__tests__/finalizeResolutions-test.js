/* eslint-env jest */

import finalizeResolutions from '../finalizeResolutions';

const RESOLUTIONS = [
  { nodes: ['a', 'b'], attributes: { foo: 'bar' } },
  { nodes: ['c', 'd'], attributes: { bazz: 'buzz' } },
  { nodes: ['a', 'b', 'c', 'd'], attributes: { fizz: 'pop' } },
  { nodes: ['e', 'f'], attributes: { bar: 'bazz' } },
];

describe('finalizeResolutions', () => {
  it('converts a list of historical resolutions in a list of end-changes', () => {
    const subject = finalizeResolutions(RESOLUTIONS);
    expect(subject.length).toBe(2);
    expect(subject[0]).toMatchObject(RESOLUTIONS[3]);
    expect(subject[1]).toMatchObject(RESOLUTIONS[2]);
  });
});
