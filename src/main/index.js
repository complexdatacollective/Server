const path = require('path');
const { app } = require('electron');

const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');
const { createServer, actions } = require('./worker/serverManager');

const mainWindow = createMainWindow();

// start the server
// require('./server-starter');
// Background server
let server = null;
const settingsDb = path.join(app.getPath('userData'), 'db', 'settings');
createServer(8080, settingsDb).then((serverProcess) => {
  server = serverProcess;
  server.on(actions.PAIRING_CODE_AVAILABLE, ({ data }) => {
    mainWindow.send(actions.PAIRING_CODE_AVAILABLE, data);
  });
  server.on(actions.PAIRING_COMPLETE, ({ data }) => {
    mainWindow.send(actions.PAIRING_COMPLETE, data);
  });
});

// Keep reference; if tray is GCed, it disappears
let tray; // eslint-disable-line no-unused-vars

const trayMenu = [
  {
    label: 'Overview',
    click: () => { mainWindow.open('/overview'); },
  },
  {
    label: 'Export data',
    click: () => { mainWindow.open('/export'); },
  },
  {
    label: 'Settings',
    click: () => { mainWindow.open('/settings'); },
  },
  {
    label: 'Quit',
    click: () => { app.quit(); },
  },
];

app.on('ready', () => {
  tray = createTray(trayMenu);
  mainWindow.open('/overview');
});

app.on('browser-window-created', app.dock.show);

// Don't quit when all windows are closed.
app.on('window-all-closed', app.dock.hide);

app.on('before-quit', () => {
  if (server) {
    server.stop();
  }
});
