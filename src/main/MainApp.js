const { get, find } = require('lodash');
const { app, Menu } = require('electron');
const ProtocolManager = require('./data-managers/ProtocolManager');
const MainWindow = require('./components/mainWindow');
const { AdminService } = require('./server/AdminService');
const { resetPemKeyPair } = require('./server/certificateManager');
const { isWindows } = require('./utils/environment');
const { createTray } = require('./components/tray');

const guiProxy = require('./guiProxy');
const Updater = require('./Updater');

const dialog = require('./dialog');
const { buildMockData } = require('./utils/db-size');

// TODO: move/centralize
const FileImportUpdated = 'FILE_IMPORT_UPDATED';
const PROTOCOL_IMPORT_SUCCEEDED = 'PROTOCOL_IMPORT_SUCCEEDED';

const userDataDir = app.getPath('userData');
const adminService = new AdminService({ dataDir: userDataDir });
const protocolManager = new ProtocolManager(userDataDir);

const createApp = () => {
  const mainWindow = new MainWindow();
  guiProxy.setMainWindow(mainWindow);

  const openMainWindow = () => mainWindow.open();
  const reloadHomeScreen = () => mainWindow.open('/overview');

  // Instantiate the updater class, and check for update once on startup.
  // Do not notify the user if there are no updates.
  const updater = Updater();
  updater.checkForUpdates(true);

  const regenerateCertificates = () => {
    const responseNum = dialog.showMessageBox(mainWindow.window, {
      message: 'Regenerate certificates?',
      detail: 'Regenerating security certificates will require you to re-pair all of your devices. Do you want to continue?',
      buttons: ['Regenerate Certificates', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    });
    if (responseNum === 0) {
      resetPemKeyPair().then(adminService.resetDevices()).then(reloadHomeScreen);
    }
  };

  const resetAppData = () => {
    const responseNum = dialog.showMessageBox(mainWindow.window, {
      message: 'Destroy all application files and data?',
      detail: 'This will delete ALL existing data, including interview data, imported protocols and paired devices. Do you want to continue?',
      buttons: ['Reset Data', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    });
    if (responseNum === 0) {
      adminService.resetData().then(reloadHomeScreen);
    }
  };

  const showImportProtocolDialog = () => {
    protocolManager.presentImportDialog(mainWindow.window)
      .then((filename) => {
        // If filename is empty, user cancelled
        if (filename) {
          mainWindow.send(PROTOCOL_IMPORT_SUCCEEDED, filename);
        }
      })
      .then(() => mainWindow.send(FileImportUpdated))
      .catch((err) => {
        dialog.showErrorBox('Import Error', err && err.message);
      });
  };

  const generateTestSessions = () => {
    protocolManager.allProtocols().then((allProtocols) => {
      const developmentProtocol = find(allProtocols, ['name', 'Development (schema version 4)']);

      if (!developmentProtocol) { return; }

      const mockSessions = buildMockData(developmentProtocol);
      const developmentProtocolId = get(developmentProtocol, '_id');
      protocolManager.addSessionData(developmentProtocolId, mockSessions);
    });
  };

  let tray; // Always keep reference; if tray is GCed, it disappears
  const trayMenu = [
    {
      label: 'Overview',
      click: reloadHomeScreen,
    },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ];

  const appMenu = {
    label: 'App',
    submenu: [
      { role: 'about' },
      {
        label: 'Check for Updates...',
        click: () => updater.checkForUpdates(),
      },
      { type: 'separator' },
      { role: 'quit' },
    ],
  };

  const MenuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Protocol...',
          click: showImportProtocolDialog,
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Develop',
      submenu: [
        {
          label: 'Generate test sessions...',
          click: generateTestSessions,
        },
        { type: 'separator' },
        {
          label: 'Regenerate Certificates...',
          click: regenerateCertificates,
        },
        { type: 'separator' },
        {
          label: 'Reset App Data...',
          click: resetAppData,
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    MenuTemplate.unshift(appMenu);
  } else {
    // Use File menu
    MenuTemplate[0].submenu = MenuTemplate[0].submenu.concat(appMenu.submenu);
  }

  const menuBar = Menu.buildFromTemplate(MenuTemplate);

  app.on('ready', () => {
    if (!process.env.NC_DEV_SUPPRESS_WINDOW_DEFAULT_OPEN) {
      openMainWindow();
    }
    tray = createTray(trayMenu);
    Menu.setApplicationMenu(menuBar);
    if (isWindows) {
      // On Windows, right-click shows the menu.
      // For now, make left-click open the main window.
      // Desired UX TBD; if menu is only a collection of links to pages
      // visible with in-app nav, then this may make sense on all platforms.
      // ...or we could instead trigger tray.popUpContextMenu() here.
      tray.on('click', openMainWindow);
    }
  });

  app.on('browser-window-created', () => {
    if (app.dock) {
      app.dock.show();
    }
  });

  // By subscribing to this event, the app will not quit when all windows are closed.
  // Note: This event will not fire when the windows are closed during an update (see updater.js)
  app.on('window-all-closed', () => {
    if (app.dock) {
      app.dock.hide();
    }
  });

  // macOS: show GUI when re-opened from finder
  app.on('activate', openMainWindow);

  // Windows (and mac CLI): show GUI when re-opened
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', openMainWindow);
  }

  return {
    app,
    mainWindow,
    showImportProtocolDialog,
  };
};

module.exports = {
  createApp,
  userDataDir,
};
