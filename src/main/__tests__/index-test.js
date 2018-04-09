/* eslint-env jest */

require('../index');
const { Menu } = require('electron');

jest.mock('electron');

describe('the electron app', () => {
  it('populates the system menu', () => {
    expect(Menu.buildFromTemplate).toHaveBeenCalled();
  });
});
