const { app, dialog, Menu } = require('electron');

const ProtocolManager = require('./data-managers/ProtocolManager');
const MainWindow = require('./components/mainWindow');
const { AdminService } = require('./server/AdminService');
const { isWindows } = require('./utils/environment');
const { createTray } = require('./components/tray');

const guiProxy = require('./guiProxy');
const updater = require('./updater');

// TODO: move/centralize
const FileImportUpdated = 'FILE_IMPORT_UPDATED';

const userDataDir = app.getPath('userData');
const adminService = new AdminService({ dataDir: userDataDir });
const protocolManager = new ProtocolManager(userDataDir);

const createApp = () => {
  const mainWindow = new MainWindow();
  guiProxy.setMainWindow(mainWindow);

  const openMainWindow = () => mainWindow.open();
  const reloadHomeScreen = () => mainWindow.open('/overview');

  const resetAppData = () => {
    const responseNum = dialog.showMessageBox(mainWindow.window, {
      message: 'Destroy all application files and data?',
      detail: 'This includes all imported protocols and paired devices',
      buttons: ['Reset Data', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    });
    if (responseNum === 0) {
      adminService.resetData().then(reloadHomeScreen);
    }
  };

  const showImportProtocolDialog = () => {
    protocolManager.presentImportDialog()
      .then((filename) => {
        // If filename is empty, user cancelled
        if (filename) {
          dialog.showMessageBox(mainWindow.window, {
            title: 'Success',
            message: 'Successfully Imported:',
            detail: filename,
          });
        }
      })
      .then(() => mainWindow.send(FileImportUpdated))
      .catch((err) => {
        dialog.showErrorBox('Import Error', err && err.message);
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
        { type: 'separator' },
        {
          label: 'Reset Data...',
          click: resetAppData,
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

  // Don't quit when all windows are closed.
  app.on('window-all-closed', () => {
    if (app.dock) {
      app.dock.hide();
    }
  });

  // macOS: show GUI when re-opened from finder
  app.on('activate', openMainWindow);

  // Windows (and mac CLI): show GUI when re-opened
  const isSecondInstance = app.makeSingleInstance(openMainWindow);
  if (isSecondInstance) {
    app.quit();
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
