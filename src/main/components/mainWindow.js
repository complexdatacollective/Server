const path = require('path');
const url = require('url');
const logger = require('electron-log');
const { BrowserWindow, ipcMain } = require('electron');

class MainWindow {
  constructor() {
    this.notificationObservers = [];
  }

  create() {
    if (this.window) { return; }

    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      center: true,
      title: 'Network Canvas Server',
    });

    this.window.maximize();

    // Open the DevTools.
    this.window.webContents.openDevTools({ mode: 'detach' });

    // Emitted when the window is closed.
    this.window.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.window = null;
    });

    ipcMain.on('notification-registration', (event, arg) => {
      logger.debug('MainWindow:notification-registration', arg);
      this.notificationObservers.push(event.sender);
    });
  }

  open(route = '/') {
    this.create();
    this.window.loadURL(this.getAppUrl(route));
    this.window.show();
  }

  send(...args) {
    if (!this.window) { return; }

    this.window.webContents.send(...args);
  }

  getAppUrl(route) {
    if (process.env.NODE_ENV === 'development' && process.env.WEBPACK_DEV_SERVER_PORT) {
      return url.format({
        hash: `#${route}`,
        host: `localhost:${process.env.WEBPACK_DEV_SERVER_PORT}`,
        protocol: 'http',
      });
    } else {
      return url.format({
        pathname: path.join(__dirname, '../', 'index.html'),
        hash: `#${route}`,
        protocol: 'file:',
      });
    }
  }

  deliverNotification(data) {
    if (this.notificationObservers.length == 0) {
      // TODO: store in a buffer, probably?
      logger.warn("Notification not sent: no observers");
    }
    this.notificationObservers.forEach(observer => {
      observer.send('notification', data);
    });
  }
}

const createMainWindow = () =>
  new MainWindow();

exports.createMainWindow = createMainWindow;
