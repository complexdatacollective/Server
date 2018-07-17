/* eslint-disable no-console */
/* istanbul ignore next */
(function devBrowserShim() {
  module.exports = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    verbose: console.log,
    debug: console.log,
    silly: console.log,
  };
}());
