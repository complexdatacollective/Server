/* eslint-env jest */
const store = require('../store');
const rootReducer = require('../modules/rootReducer');

jest.mock('electron-log');
jest.mock('../modules/rootReducer');

// silence redux logger
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});

describe('App Store', () => {
  it('includes the root reducer', () => {
    expect(rootReducer.default).toHaveBeenCalled();
  });

  it('includes a persistor', () => {
    expect(store.persistor).toBeDefined();
  });
});
