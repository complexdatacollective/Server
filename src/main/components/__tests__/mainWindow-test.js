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
    it('calls window.loadURL with the correct attributes', () => {
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

    it('focuses the window', () => {
      mainWindow.open('/');
      expect(mainWindow.window.show).toHaveBeenCalledTimes(1);
    });

    it('re-focuses the window', () => {
      mainWindow.open('/a');
      mainWindow.window.webContents.getURL = jest.fn().mockReturnValueOnce('a');
      mainWindow.open('/b');
      expect(mainWindow.window.show).toHaveBeenCalledTimes(2);
    });

    it('accepts URLs', () => {
      const fileUrl = 'file://index.html';
      mainWindow.open(fileUrl);
      expect(mainWindow.window.loadURL).toHaveBeenCalledWith(fileUrl);
    });

    it('shows the default route if none provided', () => {
      mainWindow.open();
      expect(mainWindow.window.loadURL).toHaveBeenCalledWith(expect.stringMatching('file://'));
      expect(mainWindow.window.show).toHaveBeenCalled();
    });

    it('shows the window without loading (if a URL is already loaded)', () => {
      // Setup: open once to instantiate `window` & simulate a URL being loaded
      mainWindow.open('/');
      mainWindow.window.webContents.getURL = jest.fn().mockReturnValueOnce('a');
      mainWindow.window.loadURL.mockClear();
      mainWindow.window.show.mockClear();

      mainWindow.open();
      expect(mainWindow.window.loadURL).not.toHaveBeenCalled();
      expect(mainWindow.window.show).toHaveBeenCalled();
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
