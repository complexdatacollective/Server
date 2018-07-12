const { ipcMain } = require('electron');
const logger = require('electron-log');

const { autoUpdater } = require('electron-updater');

const { createApp, userDataDir } = require('./MainApp');
const { createServer } = require('./server/ServerFactory');
const { DefaultApiPort } = require('./server/devices/DeviceService');

const ApiConnectionInfoChannel = 'API_INFO';
const RequestApiConnectionInfoChannel = 'REQUEST_API_INFO';
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';

const { app, mainWindow, showImportProtocolDialog } = createApp();

let server = null;
createServer(DefaultApiPort, userDataDir).then((runningServer) => {
  server = runningServer;

  app.on('before-quit', () => server.close());

  // Renderer may be ready before server, in which case send:
  mainWindow.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);

  ipcMain.on(RequestApiConnectionInfoChannel, (evt) => {
    evt.sender.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);
  });

  ipcMain.on(RequestFileImportDialog, showImportProtocolDialog);
}).catch((err) => {
  logger.error('createServer failed', err);
  throw err;
});

process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection:', err);
});

autoUpdater.logger = logger;
autoUpdater.checkForUpdatesAndNotify();

