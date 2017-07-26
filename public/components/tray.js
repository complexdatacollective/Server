const path = require('path');
const url = require('url');
const menubar = require('menubar');

const icon = url.format({
  pathname: path.join(__dirname, 'icons', 'round', 'round.png'),
  protocol: 'file:',
});

const trayUrl = url.format({
  pathname: path.join(__dirname, '../', 'index.html'),
  hash: '#/tray',
  protocol: 'file:',
});

exports.createTray = () =>
  menubar({
    index: trayUrl,
    icon,
    preloadWindow: true,
    width: 300,
    height: 210,
    tooltip: 'Network Canvas Server',
  });
