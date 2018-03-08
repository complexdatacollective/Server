const path = require('path');
const { app } = require('electron');

const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');
const { createServer } = require('./worker/serverManager');

// Background server
let server = null;
const settingsDb = path.join(app.getPath('userData'), 'db', 'settings');
createServer(8080, settingsDb).then(serverProcess => server = serverProcess);

// GUI
const mainWindow = createMainWindow();

let tray; // Keep reference; if tray is GCed, it disappears
const trayMenu = [
  {
    label: 'Overview',
    click: () => { mainWindow.open('/overview'); }
  },
  {
    label: 'Export data',
    click: () => { mainWindow.open('/export'); }
  },
  {
    label: 'Quit',
    click: () => { app.quit(); }
  },
];

app.on('ready', () => {
  app.dock.hide();
  tray = createTray(trayMenu);
});

app.on('before-quit', () => {
  server.stop();
});

// Don't quit when all windows are closed.
app.on('window-all-closed', () => { });  // no op
