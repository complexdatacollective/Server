/* eslint-env jest */

const { dialog } = require('electron');

const dialogProxy = require('../dialog');
const { globalDialogLock } = require('../dialogLock');

jest.mock('../dialogLock');

describe('the dialog proxy', () => {
  beforeEach(() => {
    globalDialogLock.isLocked = false;
  });

  it('implements methods from electron dialog', () => {
    Object.keys(dialog).forEach((fn) => {
      expect(dialogProxy[fn]).toBeDefined();
    });
  });

  it('prevents consecutive dialog opens when a callback is available', () => {
    dialog.showOpenDialog.mockClear();
    dialogProxy.showOpenDialog({}, jest.fn());
    dialogProxy.showOpenDialog({}, jest.fn());
    expect(dialog.showOpenDialog).toHaveBeenCalledTimes(1);
  });

  it('does not prevent if no callback is available', () => {
    dialog.showOpenDialog.mockClear();
    dialogProxy.showOpenDialog({});
    dialogProxy.showOpenDialog({});
    expect(dialog.showOpenDialog).toHaveBeenCalledTimes(2);
  });
});
