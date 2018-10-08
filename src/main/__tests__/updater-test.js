/* eslint-env jest */

const updater = require('../updater');
const dialog = require('../dialog');

jest.mock('electron');
jest.mock('electron-updater');
jest.mock('../dialog');

describe('updater', () => {
  beforeEach(() => {
    dialog.showMessageBox.mockClear();
  });

  it('provides an update hook', async () => {
    await expect(updater.checkForUpdates()).resolves.toEqual(expect.anything());
  });

  it('does not download automatically', () => {
    expect(updater.autoDownload).toBe(false);
  });

  it('shows a message when update available', () => {
    updater.simulate('update-available', {});
    expect(dialog.showMessageBox).toHaveBeenCalled();
  });

  it('shows a message when download ready', () => {
    updater.simulate('update-downloaded', {});
    expect(dialog.showMessageBox).toHaveBeenCalled();
  });

  it('shows a message when no update available', () => {
    updater.simulate('update-not-available', {});
    expect(dialog.showMessageBox).toHaveBeenCalled();
  });
});
