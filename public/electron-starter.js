const { ipcMain } = require('electron');
const { createMainWindow } = require('./mainWindow');
const { createTray } = require('./tray');
const { createServer } = require('./server');

const port = 8080;
const mainWindow = createMainWindow();
const tray = createTray();
const server = createServer(port);

ipcMain.on('REQUEST_SERVER_OVERVIEW', () => {
  mainWindow.send(
    'SERVER_OVERVIEW',
    {},
  );
});

ipcMain.on('WINDOW_OPEN', (route) => {
  mainWindow.open(route);
});

ipcMain.on('APP_QUIT', () => {
  tray.app.quit();
});
