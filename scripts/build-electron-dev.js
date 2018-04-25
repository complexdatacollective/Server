const fs = require('fs-extra');
const path = require('path');
const paths = require('../config/paths');

const mainSrc = path.join(paths.appSrc, 'main');

function copySrc() {
  fs.emptyDirSync(paths.electronDev);

  fs.copySync(mainSrc, paths.electronDev, {
    filter: file => !(/__tests__/).test(file),
  });

  fs.copySync(paths.appPublic, paths.electronDev, {
    dereference: true,
    filter: file => file !== paths.appHtml,
  });
}

// if (process.env.WATCH) {
//   fs.watch(mainSrc, { recursive: true }, (eventType, filename) => {
//     console.log(eventType, filename);
//   });
// } else {
copySrc();
// }
