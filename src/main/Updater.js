/* eslint-disable class-methods-use-this */

const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');
const EventEmitter = require('events').EventEmitter;

class Updater {
  constructor() {
    this.releasesUrl = 'https://github.com/codaco/Server/releases';
    this.events = new EventEmitter();
    autoUpdater.autoDownload = false;
    autoUpdater.on('error', this.onError);
    autoUpdater.on('update-available', this.onUpdateAvailable.bind(this));
    autoUpdater.on('update-downloaded', this.onUpdateDownloaded);
    autoUpdater.on('update-not-available', this.onUpdateNotAvailable.bind(this));
  }

  onUpdateAvailable(updateInfo) {
    dialog.showMessageBox({
      type: 'question',
      title: 'Update Available',
      message: 'Do you want update now?',
      detail: `Version ${updateInfo.releaseName} is available.\n\nRelease notes are available at:\n${this.releasesUrl}\n\nClick 'Download and Restart' to fetch this update and install it. Ensure you have exported or backed up any important data before continuing.`,
      buttons: ['Download and Restart', 'Cancel'],
    },
    (buttonIndex) => {
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }

  onUpdateNotAvailable() {
    if (this.notifyOnNoUpdates) {
      dialog.showMessageBox({
        title: 'No Updates Available',
        message: 'Server is up-to-date.',
      });
    } else {
      log.info('No updates available (did not notify user).');
    }
  }

  onUpdateDownloaded() {
    dialog.showMessageBox({
      title: 'Install Update',
      message: 'Download Complete',
      detail: 'Your update is ready to install. You must now restart the app and install the update.',
      buttons: ['Restart'],
    },
    () => setImmediate(() => autoUpdater.quitAndInstall()));
  }

  onError(error) {
    if (this.notifyOnNoUpdates) {
      const detail = error ? (error.stack || error).toString() : 'An unknown error occurred';
      log.error(detail);
      dialog.showMessageBox({
        title: 'Error',
        message: 'Download Complete',
        detail: 'There was an error checking for updates. You may need to update this app manually.',
        buttons: ['Okay'],
      });
    } else {
      log.error('There was an error checking for updates (did not notify user).');
    }
  }

  simulate(event, handler) {
    autoUpdater.simulate(event, handler);
  }

  checkForUpdates(notifyOnNoUpdates = true) {
    this.notifyOnNoUpdates = !!notifyOnNoUpdates;
    autoUpdater.checkForUpdates();
  }
}

module.exports = Updater;

