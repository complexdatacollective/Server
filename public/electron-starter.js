const path = require('path');
const url = require('url');
const menubar = require('menubar');
const BrowserWindow = require('electron').BrowserWindow;
// // Module to create native browser window.
// const BrowserWindow = electron.BrowserWindow;

const trayUrl = url.format({
  pathname: path.join(__dirname, 'index.html'),
  hash: '#/tray',
  protocol: 'file:',
});

const mb = menubar({
  index: trayUrl,
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    title: 'Network Canvas Server'
  });

  mainWindow.maximize();

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
  }));

  // Open the DevTools.
  mainWindow.webContents.openDevTools({ mode:'detach' });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
  })
}

mb.on('ready', createWindow);
