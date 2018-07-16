const logger = require('electron-log');

/**
 * Provides a single communication channel to the renderer's main window.
 * @namespace guiProxy
 */
class GuiProxy {
  /**
   * Should be called once, by the main process, to set up a persistent connection
   * to the main window
   * @param {MainWindow} mainWindow The app's main window
   * @memberOf guiProxy
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Send a message to the main window's web contents, if open.
   * @memberOf guiProxy
   * @param {...string} args See https://electronjs.org/docs/api/web-contents#contentssendchannel-arg1-arg2-
   * @return {boolean} `false` if the window is closed, or has not been initialized;
   *                         `true` if the message was sent successfully.
   */
  send(...args) {
    if (this.mainWindow) {
      return this.mainWindow.send(...args);
    }
    logger.warn('mainWindow is not set');
    return false;
  }
}

const sharedInstance = new GuiProxy();

module.exports = {
  sendToGui: sharedInstance.send.bind(sharedInstance),
  setMainWindow: sharedInstance.setMainWindow.bind(sharedInstance),
};
