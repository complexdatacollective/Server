/* eslint-env jest */
/* eslint-disable no-console */
const fs = require('fs');

const { makeTempDir, tmpDirPrefix } = require('../dir');

describe('makeTempDir', () => {
  it('makes a temp dir', async () => {
    const tempDir = await makeTempDir();
    expect(tempDir).toMatch(tmpDirPrefix);
    try {
      if ((tempDir).indexOf('org.codaco.server') > 0) {
        fs.rmdirSync(tempDir);
      } else {
        console.warn('Invalid tempDir:', tempDir);
      }
    } catch (err) { console.log(err); }
  });
});
