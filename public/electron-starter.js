const path = require('path');
const url = require('url');
const menubar = require('menubar');
const { BrowserWindow, ipcMain } = require('electron');
const Server = require('./server');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function openMainWindow(route = '/') {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      center: true,
      title: 'Network Canvas Server',
    });

    mainWindow.maximize();

    // Open the DevTools.
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });
  }

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    hash: `#${route}`,
    protocol: 'file:',
  }));
}

const trayUrl = url.format({
  pathname: path.join(__dirname, 'index.html'),
  hash: '#/tray',
  protocol: 'file:',
});

const icon = url.format({
  pathname: path.join(__dirname, 'icons', 'round', 'round.png'),
  protocol: 'file:',
});

// Start GUI
const mb = menubar({
  index: trayUrl,
  icon,
  preloadWindow: true,
  width: 300,
  height: 210,
  tooltip: 'Network Canvas Server',
});

// mb.on('after-create-window', () => {
//   mb.window.openDevTools();
// });

mb.on('ready', () => {
  const server = Server(8081);

  console.log(server);

  const updateOverview = () => {
    global.server = {
      overview: server.getOverview(),
    };
  };

  updateOverview();

  server.on('connect', updateOverview);
  server.on('disconnect', updateOverview);
});

ipcMain.on('OPEN_MAIN_WINDOW', () => {
  openMainWindow();
});

ipcMain.on('QUIT', () => {
  mb.app.quit();
});
