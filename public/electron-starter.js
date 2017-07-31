const { ipcMain } = require('electron');
const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');
const { createServer } = require('./components/serverManager');

const mainWindow = createMainWindow();
const tray = createTray();

let server = null;

createServer(8080, 'db/app').then((serverProcess) => {
  server = serverProcess;
});

// tray.on('after-create-window', () => {
//   tray.window.openDevTools({ mode: 'undocked' });
// });

const serverActionHandler = ({ action, data }) => {
  switch (action) {
    case 'SERVER_STATUS':
      return mainWindow.send(
        'SERVER_OVERVIEW',
        data,
      );
    default:
      return null;
  }
};

ipcMain.on('REQUEST_SERVER_OVERVIEW', () => {
  if (!server) { return; }

  server.on(serverActionHandler);
  server.send({ action: 'REQUEST_SERVER_STATUS' });
});

ipcMain.on('WINDOW_OPEN', (route) => {
  mainWindow.open(route);
});

ipcMain.on('APP_QUIT', () => {
  tray.app.quit();
});
