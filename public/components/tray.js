const path = require('path');
const { Menu, Tray } = require('electron');

exports.createTray = (template) => {
  const tray = new Tray(path.join(__dirname, '../', 'icons', 'round', 'round.png'));

  const contextMenu = Menu.buildFromTemplate(template);

  tray.setToolTip('Network Canvas Server');

  tray.setContextMenu(contextMenu);

  return tray;
};
