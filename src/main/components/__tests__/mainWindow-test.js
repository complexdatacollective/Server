/* eslint-env jest */

const path = require('path');
const url = require('url');
const { EventEmitter } = require('events');

const MainWindow = require('../mainWindow');

jest.mock('electron');

describe('MainWindow', () => {
  let mainWindow;

  beforeEach(() => {
    mainWindow = new MainWindow();
  });

  it('It sets the window on open()', () => {
    mainWindow.open();
    expect(mainWindow.window).not.toBeNull();
  });

  it('listens for "closed"', () => {
    jest.spyOn(mainWindow, 'addWindowCloseListener');
    mainWindow.create();
    expect(mainWindow.addWindowCloseListener).toHaveBeenCalled();
  });

  it('releases the window on "closed"', () => {
    mainWindow.window = new EventEmitter();
    mainWindow.addWindowCloseListener();
    mainWindow.window.emit('closed');
    expect(mainWindow.window).toBeNull();
  });

  describe('.open()', () => {
    it('It calls window.loadURL with the correct attributes', () => {
      const route = '/foobarbazbuzz';

      mainWindow.open(route);

      const loadUrlCall = mainWindow.window.loadURL.mock.calls[0][0];

      const mainWindowIndexPath = url.format({
        pathname: path.join(__dirname, '../../', 'index.html'),
        hash: `#${route}`,
        protocol: 'file:',
      });

      expect(loadUrlCall).toEqual(mainWindowIndexPath);
    });

    it('It focuses the window', () => {
      mainWindow.open('/');
      expect(mainWindow.window.show).toHaveBeenCalledTimes(1);
    });

    it('It re-focuses the window', () => {
      mainWindow.open('/a');
      mainWindow.window.webContents.getURL = jest.fn().mockReturnValueOnce('a');
      mainWindow.open('/b');
      expect(mainWindow.window.show).toHaveBeenCalledTimes(2);
    });
  });

  describe('.send()', () => {
    it('Forwards messages to its window', () => {
      mainWindow.open();
      const sent = mainWindow.send('foo');
      expect(mainWindow.window.webContents.send).toHaveBeenCalledTimes(1);
      expect(sent).toBe(true);
    });

    it('Drops messages when no window open', () => {
      const sent = mainWindow.send('foo');
      expect(sent).toBe(false);
    });
  });
});
