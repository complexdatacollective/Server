const path = require('path');
const url = require('url');
const { BrowserWindow } = require('electron');

class MainWindow {
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
  }

  open(route = '/') {
    this.create();

    this.window.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      hash: `#${route}`,
      protocol: 'file:',
    }));
  }

  send(...args) {
    if (!this.window) { return; }

    console.log('sending', ...args);

    this.window.webContents.send(...args);
  }
}

const createMainWindow = () =>
  new MainWindow();

exports.createMainWindow = createMainWindow;
