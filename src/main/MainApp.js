const { app, dialog, Menu } = require('electron');

const ProtocolManager = require('./data-managers/ProtocolManager');
const MainWindow = require('./components/mainWindow');
const { AdminService } = require('./server/AdminService');
const { isWindows } = require('./utils/environment');
const { createTray } = require('./components/tray');

// TODO: move/centralize
const FileImportUpdated = 'FILE_IMPORT_UPDATED';

const userDataDir = app.getPath('userData');
const adminService = new AdminService({ dataDir: userDataDir });
const protocolManager = new ProtocolManager(userDataDir);

const createApp = () => {
  const mainWindow = new MainWindow();

  const resetAppData = () => {
    const responseNum = dialog.showMessageBox(mainWindow.window, {
      message: 'Destroy all application files and data?',
      detail: 'This includes all imported protocols and paired devices',
      buttons: ['Reset Data', 'Cancel'],
      cancelId: 1,
      defaultId: 0,
    });
    if (responseNum === 0) {
      adminService.resetData()
        .then(() => {
          mainWindow.open('/');
          // The following provides a full restart if needed
          // (but is more jarring and loses pipe to stdout during dev):
          // app.relaunch();
          // app.quit();
        });
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
      click: () => { mainWindow.open('/overview'); },
    },
    {
      label: 'Quit',
      click: () => { app.quit(); },
    },
  ];

  const MenuTemplate = [
    {
      submenu: [
        // {
        //   label: 'Settings',
        //   click: () => mainWindow.open('/settings'),
        // },
        // { type: 'separator' },
        { role: 'quit' },
      ],
    },
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

  if (process.platform !== 'darwin') {
    // Get rid of the macOS primary menu
    MenuTemplate.shift();
    // Add those items elsewhere as appropriate
    // MenuTemplate[0].submenu.push({ type: 'separator' });
    // MenuTemplate[0].submenu.push({
    //   label: 'Settings',
    //   click: () => mainWindow.open('/settings'),
    // });
    MenuTemplate[0].submenu.push({ type: 'separator' });
    MenuTemplate[0].submenu.push({ role: 'quit' });
  }

  const appMenu = Menu.buildFromTemplate(MenuTemplate);

  app.on('ready', () => {
    if (!process.env.DEV_SUPPRESS_WINDOW_DEFAULT_OPEN) {
      mainWindow.open('/overview');
    }
    tray = createTray(trayMenu);
    Menu.setApplicationMenu(appMenu);
    if (isWindows) {
      // On Windows, right-click shows the menu.
      // For now, make left-click open the main window.
      // Desired UX TBD; if menu is only a collection of links to pages
      // visible with in-app nav, then this may make sense on all platforms.
      // ...or we could instead trigger tray.popUpContextMenu() here.
      tray.on('click', () => mainWindow.open('/overview'));
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
