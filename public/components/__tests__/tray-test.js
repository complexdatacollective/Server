/* eslint-env jest */

const path = require('path');
const url = require('url');
const menubar = require('menubar');
const { createTray } = require('../tray');

jest.mock('menubar');

describe('createTray', () => {
  it('It calls menubar with the correct attributes', () => {
    createTray();
    const menubarCall = menubar.mock.calls[0][0];

    const trayIndexPath = url.format({
      pathname: path.join(__dirname, '../../', 'index.html'),
      hash: '#/tray',
      protocol: 'file:',
    });

    expect(menubarCall.index).toEqual(trayIndexPath);
  });
});
