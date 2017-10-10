const { app } = require('electron');
const { createMainWindow } = require('./components/mainWindow');
const { createTray } = require('./components/tray');

// start the server
require('./server-starter');

const mainWindow = createMainWindow();

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
  createTray(trayMenu);
});

// Don't quit when all windows are closed.
app.on('window-all-closed', () => { });  // no op
