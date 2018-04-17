const { ipcMain } = require('electron');
const logger = require('electron-log');

const { createApp, userDataDir } = require('./MainApp');
const { createServer, serverEvents } = require('./server/ServerFactory');

const ApiConnectionInfoChannel = 'API_INFO';
const RequestApiConnectionInfoChannel = 'REQUEST_API_INFO';

const { app, mainWindow } = createApp();

let server = null;
createServer(8080, userDataDir).then((runningServer) => {
  server = runningServer;

  app.on('before-quit', () => server.close());

  // Renderer may be ready before server, in which case send:
  mainWindow.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);

  ipcMain.on(RequestApiConnectionInfoChannel, (evt) => {
    evt.sender.send(ApiConnectionInfoChannel, server.connectionInfo.adminService);
  });

  server.on(serverEvents.PAIRING_CODE_AVAILABLE, (data) => {
    mainWindow.send(serverEvents.PAIRING_CODE_AVAILABLE, data);
  });

  server.on(serverEvents.PAIRING_COMPLETE, (data) => {
    mainWindow.send(serverEvents.PAIRING_COMPLETE, data);
  });
}).catch((err) => {
  logger.error(err);
  throw err;
});
