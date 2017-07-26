const { ipcMain } = require('electron');
const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');
const { createServer } = require('./components/serverManager');

const mainWindow = createMainWindow();
const tray = createTray();

let server = null;

createServer(8080).then((serverProcess) => {
  server = serverProcess;
});

// tray.on('after-create-window', () => {
//   tray.window.openDevTools({ mode: 'undocked' });
// });

ipcMain.on('REQUEST_SERVER_OVERVIEW', () => {
  if (!server) { return; }

  server.onMessage('SERVER_STATUS', (data) => {
    mainWindow.send(
      'SERVER_OVERVIEW',
      data,
    );
  });

  server.send({ action: 'SERVER_STATUS' });
});

ipcMain.on('WINDOW_OPEN', (route) => {
  mainWindow.open(route);
});

ipcMain.on('APP_QUIT', () => {
  tray.app.quit();
});
