/* eslint-env jest */

const path = require('path');
const url = require('url');
const { createMainWindow } = require('../mainWindow');

jest.mock('electron');

describe('createMainWindow', () => {
  describe('.open()', () => {
    it('It calls window.loadURL with the correct attributes', () => {
      const mainWindow = createMainWindow();
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
      const mainWindow = createMainWindow();

      mainWindow.open('/');

      expect(mainWindow.window.show.mock.calls.length).toEqual(1);
    });
  });
});
