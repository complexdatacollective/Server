const { ipcMain, BrowserWindow } = require('electron');
const logger = require('electron-log');

const { createApp, userDataDir } = require('./MainApp');
const { createServer } = require('./server/ServerFactory');

const ApiConnectionInfoChannel = 'API_INFO';
const RequestApiConnectionInfoChannel = 'REQUEST_API_INFO';
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';

const { app, mainWindow, showImportProtocolDialog } = createApp();

let server = null;
let errorMessage = null;
createServer(userDataDir).then((runningServer) => {
  server = runningServer;

  app.on('before-quit', () => server.close());

  // Renderer may be ready before server, in which case send:
  mainWindow.send(ApiConnectionInfoChannel, server.connectionInfo);

  ipcMain.on(RequestApiConnectionInfoChannel, (evt) => {
    evt.sender.send(ApiConnectionInfoChannel, server.connectionInfo);
  });

  ipcMain.on(RequestFileImportDialog, showImportProtocolDialog);
}).catch((err) => {
  logger.error('createServer failed', err);
  throw err;
});

const handleErrorAndClose = (err, errorType) => {
  if (errorMessage) return; // already showing user a fatal error
  errorMessage = err;
  logger.error(`${errorType}:`, err);
  const errorDialog = new BrowserWindow({
    parent: (mainWindow && mainWindow.window),
    modal: true,
    show: false,
    frame: false,
  });
  errorDialog.loadFile('utils/errorDialog.html', { query: { error: err.stack } });
  errorDialog.on('closed', () => process.exit(1));
  errorDialog.show();
};

process.on('unhandledRejection', (err) => {
  handleErrorAndClose(err, 'unhandledRejection');
});

process.on('uncaughtException', (err) => {
  handleErrorAndClose(err, 'uncaughtException');
});
