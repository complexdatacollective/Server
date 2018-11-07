const { dialog } = require('electron');

const { globalDialogLock } = require('./dialogLock');

const proxiedDialogMethod = (func) => {
  const handler = {
    apply: (target, thisArg, argumentsList) => {
      if (globalDialogLock.isLocked) {
        return undefined;
      }
      const callback = argumentsList[argumentsList.length - 1];
      if (typeof callback === 'function') {
        globalDialogLock.isLocked = true;
        argumentsList.splice(-1, 1, (...args) => {
          globalDialogLock.isLocked = false;
          callback(...args);
        });
      }
      return target.apply(thisArg, argumentsList);
    },
  };
  return new Proxy(func, handler);
};

/**
 * A proxy to electron's dialog.
 *
 * dialog is proxied in order to prevent multiple native dialogs from opening.
 * This includes any dialog with a callback (notably, for file opening and messaging).
 * When the callback is fired, the lock is released.
 *
 * This prevents issues when multiple modal dialogs are used (for example, the 'reset'
 * message not being shown and its menu item then being disabled until app restart).
 *
 * All app components should use this proxy rather than including
 * [electron's dialog]{@link https://electronjs.org/docs/api/dialog} directly.
 *
 * @type {Object}
 */
const dialogProxy = {};

Object.entries(dialog).forEach(([k, v]) => {
  if (typeof v === 'function') {
    dialogProxy[k] = proxiedDialogMethod(v);
  } else {
    dialogProxy[k] = v;
  }
});

module.exports = dialogProxy;
