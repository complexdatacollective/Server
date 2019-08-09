/* eslint-env jest */
const { app, Menu, Tray } = require('electron');

const { createApp } = require('../MainApp');
const { createTray } = require('../components/tray');

jest.mock('electron');
jest.mock('electron-updater');
jest.mock('../components/tray');

describe('the created app', () => {
  it('populates the system menu', () => {
    createApp();
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
  });

  describe('on "ready"', () => {
    let mainWindow;
    let readyCallback;
    let trayMenu;

    beforeAll(() => {
      app.on.mockImplementation((evtName, cb) => {
        if (evtName === 'ready') {
          readyCallback = cb;
        }
      });

      createTray.mockImplementation((menu) => {
        trayMenu = menu;
        return new Tray();
      });
    });

    beforeEach(() => {
      ({ mainWindow } = createApp());
    });

    it('sets the application menu', () => {
      readyCallback();
      expect(Menu.setApplicationMenu).toHaveBeenCalled();
    });

    it('opens the main window', () => {
      mainWindow.open = jest.fn();
      readyCallback();
      expect(mainWindow.open).toHaveBeenCalled();
    });

    describe('the tray menu', () => {
      it('is created', () => {
        readyCallback();
        expect(trayMenu).toBeDefined();
        expect(trayMenu[0].label).toEqual('Overview');
        expect(trayMenu[1].label).toEqual('Quit');
      });

      it('lets a user opens the overvew page', () => {
        mainWindow.open = jest.fn();
        readyCallback();
        mainWindow.open.mockReset(); // clear the initial open call
        trayMenu[0].click();
        expect(mainWindow.open).toHaveBeenCalledTimes(1);
      });

      it('lets a user quit', () => {
        mainWindow.open = jest.fn();
        readyCallback();
        app.quit.mockReset();
        trayMenu[1].click();
        expect(app.quit).toHaveBeenCalledTimes(1);
        app.quit.mockReset();
      });
    });
  });

  describe('on "window-all-closed"', () => {
    beforeAll(() => {
      app.on.mockImplementation((evtName, cb) => {
        if (evtName === 'window-all-closed') { cb(); }
      });
    });

    it('hides the dock icon', () => {
      createApp();
      expect(app.dock.hide).toHaveBeenCalled();
      app.dock.hide.mockReset();
    });
  });

  describe('on "browser-window-created"', () => {
    beforeAll(() => {
      app.on.mockImplementation((evtName, cb) => {
        if (evtName === 'browser-window-created') { cb(); }
      });
    });

    it('ensures dock icon is visible', () => {
      createApp();
      expect(app.dock.show).toHaveBeenCalled();
      app.dock.show.mockReset();
    });
  });
});
