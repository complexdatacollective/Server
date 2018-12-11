/* eslint-env jest */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const { makeTempDir, removeTempDir, tmpDirPrefix } = require('../dir');

// Note: mocking fs.mkdtemp breaks the test runner
describe('makeTempDir', () => {
  it('makes and removes a temp dir', async () => {
    expect.assertions(2);
    const tempDir = await makeTempDir();
    expect(tempDir).toMatch(tmpDirPrefix);
    if ((tempDir).indexOf('org.codaco.server') > 0) {
      fs.writeFileSync(path.join(tempDir, 'foo.csv'), 'test');
      await removeTempDir(tempDir);
      expect(fs.existsSync(tempDir)).toBe(false);
    } else {
      console.warn('Invalid tempDir:', tempDir);
    }
  });
});
