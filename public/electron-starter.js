const { ipcMain } = require('electron');
const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');
const { createServer } = require('./components/serverManager');

const mainWindow = createMainWindow();
const tray = createTray();

createServer(8080).then((server) => {
  server.stop();
});

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
