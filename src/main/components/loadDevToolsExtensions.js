const { BrowserWindow } = require('electron');

const loadDevToolsExtensions = () => {
  const extensions = process.env.NC_DEVTOOLS_EXENSION_PATH;
  if (process.env.NODE_ENV !== 'development' || !extensions) {
    return;
  }
  try {
    extensions.split(';').forEach((filepath) => BrowserWindow.addDevToolsExtension(filepath));
  } catch (err) {
    /* eslint-disable no-console, global-require */
    const chalk = require('chalk');
    console.warn(err);
    console.warn(chalk.yellow('A Chrome dev tools extension failed to load. If the extension has upgraded, update your NC_DEVTOOLS_EXENSION_PATH:'));
    console.warn(chalk.yellow(process.env.NC_DEVTOOLS_EXENSION_PATH));
    /* eslint-enable */
  }
};

module.exports = loadDevToolsExtensions;
