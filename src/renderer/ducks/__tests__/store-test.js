/* eslint-env jest */
const store = require('../store');
const rootReducer = require('../modules/rootReducer');

require('../../__mocks__/localStorageMock');

jest.mock('electron-log');
jest.mock('../modules/rootReducer');
jest.mock('../middleware/logger', () => (/* store */) => (/* next */) => jest.fn());

describe('App Store', () => {
  it('includes the root reducer', () => {
    expect(rootReducer.default).toHaveBeenCalled();
  });

  it('includes a persistor', () => {
    expect(store.persistor).toBeDefined();
  });
});
