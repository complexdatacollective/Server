const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');

const loadDevToolsExtensions = () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  Promise.all([
    installExtension(REACT_DEVELOPER_TOOLS),
    installExtension(REDUX_DEVTOOLS),
  ])
    .then(tools => console.log(`Added Extension:  ${tools.toString()}`))
    .catch(err => console.log('An error occurred: ', err));
};

module.exports = loadDevToolsExtensions;
