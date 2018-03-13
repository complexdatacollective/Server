'use strict';

const fs = require('fs-extra');
const path = require('path');

const paths = require('../config/paths');

fs.copySync(path.join(paths.appSrc, 'main'), path.join(paths.electronDev), {
  filter: file => !(/__tests__/).test(file),
});

fs.copySync(paths.appPublic, paths.electronDev, {
  dereference: true,
  filter: file => file !== paths.appHtml,
});
