const { ipcMain } = require('electron');
const logger = require('electron-log');

const { createApp, userDataDir } = require('./MainApp');
const { createServer, serverEvents } = require('./server/ServerFactory');

const ApiConnectionInfoChannel = 'API_INFO';
const RequestApiConnectionInfoChannel = 'REQUEST_API_INFO';
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';

const { app, mainWindow, showImportProtocolDialog } = createApp();

let server = null;
createServer(8080, userDataDir).then((runningServer) => {
  server = runningServer;

  app.on('before-quit', () => server.close());

  // Renderer may be ready before server, in which case send:
  mainWindow.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);

  ipcMain.on(RequestApiConnectionInfoChannel, (evt) => {
    evt.sender.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);
  });

  ipcMain.on(RequestFileImportDialog, showImportProtocolDialog);

  server.on(serverEvents.SESSIONS_IMPORTED, () => mainWindow.send(serverEvents.SESSIONS_IMPORTED));

  // TODO: if send() returns false, let server know so client request can be dropped?
  server.on(serverEvents.PAIRING_CODE_AVAILABLE, (data) => {
    mainWindow.send(serverEvents.PAIRING_CODE_AVAILABLE, data);
  });

  server.on(serverEvents.PAIRING_TIMED_OUT, () => {
    mainWindow.send(serverEvents.PAIRING_TIMED_OUT);
  });

  server.on(serverEvents.PAIRING_COMPLETE, (data) => {
    mainWindow.send(serverEvents.PAIRING_COMPLETE, data);
  });
}).catch((err) => {
  logger.error(err);
  throw err;
});

process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection:', err);
});
