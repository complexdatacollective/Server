/* eslint-env jest */

require('../index');
const { Menu } = require('electron');

// Don't start the server for these tests
jest.mock('../server/ServerFactory', () => ({
  serverEvents: {},
  createServer: jest.fn().mockResolvedValue({ connectionInfo: {}, on: jest.fn() }),
}));

jest.mock('electron');

describe('the electron app', () => {
  it('populates the system menu', () => {
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
  });
});
