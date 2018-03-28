/* eslint-env jest */

import { isLinux, isMacOS, isWindows } from '../environment';

describe('environment util', () => {
  it('provides booleans', () => {
    expect(isLinux === true || isLinux === false).toBe(true);
    expect(isMacOS === true || isLinux === false).toBe(true);
    expect(isWindows === true || isLinux === false).toBe(true);
  });

  it('reports true for exactly one platform', () => {
    const platformCount = [isLinux, isWindows, isMacOS].reduce((acc, env) => acc + (env ? 1 : 0));
    expect(platformCount).toBe(1);
  });
});
