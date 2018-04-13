/* eslint-env jest */

require('../index');
const { Menu } = require('electron');

// Don't start the server for these tests
jest.mock('../worker/serverManager', () => ({
  actions: {},
  createServer: jest.fn().mockResolvedValue({}),
}));

jest.mock('electron');

describe('the electron app', () => {
  it('populates the system menu', () => {
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
  });
});
