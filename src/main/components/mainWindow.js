const path = require('path');
const url = require('url');
const chalk = require('chalk');
const { BrowserWindow } = require('electron');

const loadDevToolsExtensions = () => {
  const extensions = process.env.NC_DEVTOOLS_EXENSION_PATH;
  if (process.env.NODE_ENV !== 'development' || !extensions) {
    return;
  }
  try {
    extensions.split(';').forEach(filepath => BrowserWindow.addDevToolsExtension(filepath));
  } catch (err) {
    /* eslint-disable no-console */
    console.warn(err);
    console.warn(chalk.yellow('A Chrome dev tools extension failed to load. If the extension has upgraded, update your NC_DEVTOOLS_EXENSION_PATH:'));
    console.warn(chalk.yellow(process.env.NC_DEVTOOLS_EXENSION_PATH));
    /* eslint-enable */
  }
};

const getAppUrl = (route) => {
  /* istanbul ignore if  */
  if (process.env.NODE_ENV === 'development' && process.env.WEBPACK_DEV_SERVER_PORT) {
    return url.format({
      hash: `#${route}`,
      host: `localhost:${process.env.WEBPACK_DEV_SERVER_PORT}/`,
      protocol: 'http',
    });
  }
  return url.format({
    pathname: path.join(__dirname, '../', 'index.html'),
    hash: `#${route}`,
    protocol: 'file:',
  });
};

/**
 * @class
 * Manages the sole instance of the app's BrowserWindow (electron).
 */
class MainWindow {
  create() {
    if (this.window) { return; }

    const opts = {
      width: 1440,
      height: 900,
      center: true,
      title: 'Network Canvas Server',
    };

    if (process.platform === 'darwin') {
      opts.titleBarStyle = 'hidden';
      opts.frame = false;
    }

    this.window = new BrowserWindow(opts);
    this.addWindowCloseListener();
    loadDevToolsExtensions();
  }

  addWindowCloseListener() {
    if (!this.window) { return; }
    // Emitted when the window is closed.
    this.window.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.window = null;
    });
  }

  open(route = '/') {
    this.create();
    const currentUrl = this.window.webContents.getURL();
    const newUrl = getAppUrl(route);
    if (!currentUrl || currentUrl !== newUrl) {
      this.window.loadURL(newUrl);
    }
    this.window.show();
  }

  send(...args) {
    if (!this.window) { return false; }

    this.window.webContents.send(...args);
    return true;
  }
}

module.exports = MainWindow;
