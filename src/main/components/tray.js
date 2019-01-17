const path = require('path');
const platform = require('os').platform();
const { Menu, Tray } = require('electron');

const getTrayImage = () => {
  let fileName;

  if (platform === 'darwin') {
    fileName = 'trayTemplate.png';
  } else if (platform === 'win32') {
    fileName = 'trayWindows.png';
  } else {
    fileName = 'trayDefault.png';
  }
  return path.join(__dirname, '../', 'icons', fileName);
};

exports.createTray = (template) => {
  const tray = new Tray(getTrayImage());

  const contextMenu = Menu.buildFromTemplate(template);

  tray.setToolTip('Network Canvas Server');

  tray.setContextMenu(contextMenu);

  return tray;
};

exports.getTrayImage = getTrayImage;
