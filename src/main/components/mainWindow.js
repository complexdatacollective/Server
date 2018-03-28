const path = require('path');
const url = require('url');
const { BrowserWindow } = require('electron');

const getAppUrl = (route) => {
  if (process.env.NODE_ENV === 'development' && process.env.WEBPACK_DEV_SERVER_PORT) {
    return url.format({
      hash: `#${route}`,
      host: `localhost:${process.env.WEBPACK_DEV_SERVER_PORT}`,
      protocol: 'http',
    });
  }
  return url.format({
    pathname: path.join(__dirname, '../', 'index.html'),
    hash: `#${route}`,
    protocol: 'file:',
  });
};

class MainWindow {
  create() {
    if (this.window) { return; }

    this.window = new BrowserWindow({
      nodeIntegration: false,
      width: 800,
      height: 600,
      center: true,
      title: 'Network Canvas Server',
    });

    this.window.maximize();

    // Open the DevTools.
    this.window.webContents.openDevTools();

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
    this.window.loadURL(getAppUrl(route));
    this.window.show();
  }

  send(...args) {
    // TODO: store in a buffer, probably?
    if (!this.window) { return; }

    this.window.webContents.send(...args);
  }
}

const createMainWindow = () =>
  new MainWindow();

exports.createMainWindow = createMainWindow;
