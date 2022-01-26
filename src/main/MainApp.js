const { get, find } = require('lodash');
const { app, Menu, dialog } = require('electron');
const ProtocolManager = require('./data-managers/ProtocolManager');
const MainWindow = require('./components/mainWindow');
const { AdminService } = require('./server/AdminService');
const { resetPemKeyPair } = require('./server/certificateManager');
const { isWindows } = require('./utils/environment');
const { createTray } = require('./components/tray');
const { buildMockData } = require('./utils/buildMockData');

const guiProxy = require('./guiProxy');

// TODO: move/centralize
const FileImportUpdated = 'FILE_IMPORT_UPDATED';
const RESET_APP = 'RESET_APP';

const userDataDir = app.getPath('userData');
const adminService = new AdminService({ dataDir: userDataDir });
const protocolManager = new ProtocolManager(userDataDir);

const createApp = () => {
  const mainWindow = new MainWindow();
  guiProxy.setMainWindow(mainWindow);

  const openMainWindow = () => mainWindow.open();
  const reloadHomeScreen = () => mainWindow.open('/');

  const regenerateCertificates = () => {
    dialog.showMessageBox(mainWindow.window, {
      message: 'Regenerate certificates?',
      detail: 'Regenerating security certificates will require you to re-pair all of your devices. Do you want to continue?',
      buttons: ['Regenerate Certificates', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        resetPemKeyPair()
          .then(adminService.resetDevices())
          .then(() => mainWindow.send(RESET_APP));
      }
    });
  };

  const resetAppData = () => {
    dialog.showMessageBox(mainWindow.window, {
      message: 'Destroy all application files and data?',
      detail: 'This will delete ALL existing data, including interview data, imported protocols and paired devices. Do you want to continue?',
      buttons: ['Reset Data', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        if (response === 0) {
          adminService.resetData()
            .then(() => mainWindow.send(RESET_APP));
        }
      }
    });
  };

  const showImportProtocolDialog = () => protocolManager.presentImportProtocolDialog(
    mainWindow.window,
  ).then(() => mainWindow.send(FileImportUpdated)).catch((err) => {
    dialog.showErrorBox('Protocol Import Error', err && err.message);
  });

  const showImportSessionDialog = () => protocolManager.presentImportSessionDialog(
    mainWindow.window,
  ).catch((err) => {
    dialog.showErrorBox('Session Import Error', err && err.message);
  });

  const correctSessionVariableTypes = () => dialog.showMessageBox(mainWindow.window, {
    type: 'warning',
    title: 'Correcting variable types',
    message: 'This action will attempt to correct issues with sessions imported from graphml files that contain categorical data. If this scenario does not apply to you, click cancel. Please export or backup your data prior to proceeding as this process could result in data loss.',
    buttons: ['Cancel', 'Continue'],
    cancelId: 0,
    defaultId: 0,
  }).then(({ response }) => {
    if (response === 1) {
      protocolManager.correctSessionVariableTypes();
    }
  });

  const generateTestSessions = (number) => {
    protocolManager.allProtocols().then((allProtocols) => {
      const developmentProtocol = find(allProtocols, ['name', 'Development']);
      if (!developmentProtocol) { return; }
      const mockSessions = buildMockData(developmentProtocol, number);
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
      { type: 'separator' },
      { role: 'quit' },
    ],
  };

  const MenuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Create Workspace from Protocol...',
          click: showImportProtocolDialog,
        },
        { type: 'separator' },
        {
          label: 'Import Interview Files (.graphml)...',
          click: showImportSessionDialog,
        },
        { type: 'separator' },
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
        { role: 'toggledevtools' },
        { type: 'separator' },
        {
          label: 'Correct Inconsistent Variable Types',
          click: correctSessionVariableTypes,
        },
        { type: 'separator' },
        {
          label: 'Generate large test dataset',
          click: () => generateTestSessions(4500),
        },
        {
          label: 'Generate small test dataset',
          click: () => generateTestSessions(100),
        },
        {
          label: 'Generate tiny test dataset',
          click: () => generateTestSessions(3),
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
