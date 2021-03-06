const path = require('path');
const url = require('url');
const { BrowserWindow } = require('electron');

const loadDevToolsExtensions = require('./loadDevToolsExtensions');

const DefaultHomeRoute = '/';

/**
 * Convert an app route to a full URL using hash-based routing.
 * If the route is already a URL, return it unchanged
 * @private
 * @param  {string} path or URL (Example: '/')
 * @return {string} full app URL (Example: 'file:///www/index.html#/')
 */
const getAppUrl = (route) => {
  if (url.parse(route).protocol) {
    return route;
  }
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
 * Manages the sole instance of the app's BrowserWindow (electron).
 */
class MainWindow {
  create() {
    if (this.window) { return; }

    const opts = {
      backgroundColor: '#dae3e5', // match UI background color
      center: true,
      height: 900,
      title: 'Network Canvas Server',
      width: 1440,
      minWidth: 1280,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: true,
      },
    };

    if (process.platform === 'darwin') {
      opts.titleBarStyle = 'hidden';
      opts.frame = false;
    }

    this.window = new BrowserWindow(opts);
    this.addWindowCloseListener();
    this.window.webContents.on('new-window', (evt, newUrl) => {
      // A user may have tried to open a new window (shift|cmd-click); open here instead
      evt.preventDefault();
      this.open(newUrl);
    });

    // For now, any navigation off the SPA is unneeded
    this.window.webContents.on('will-navigate', (evt) => {
      evt.preventDefault();
    });

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

  /**
   * Open the window with the provided route.
   * If no route is given and a URL is already loaded, then maintain the current URL
   * without reloading.
   * @param {string?} route A route ('/') or URL to open
   */
  open(route) {
    this.create();
    const currentUrl = this.window.webContents.getURL();
    if (route || !currentUrl) {
      const newUrl = getAppUrl(route || DefaultHomeRoute);
      if (currentUrl !== newUrl) {
        this.window.loadURL(newUrl);
      }
    }
    this.window.show();
  }

  /**
   * Send a message to the window's webContents, if available.
   * @param {string} channel
   * @param {...any} any See {@link https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-|WebContents.send}
   *  in the electron docs
   * @return {boolean} true if message was sent; false if window is unavailable for sending.
   */
  send(...args) {
    if (!this.window) { return false; }

    this.window.webContents.send(...args);
    return true;
  }
}

module.exports = MainWindow;
