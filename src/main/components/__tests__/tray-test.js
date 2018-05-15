/* eslint-env jest */
import { createTray } from '../tray';

jest.mock('electron');

describe('tray', () => {
  it('sets its context menu', () => {
    const tray = createTray();
    expect(tray.setContextMenu).toHaveBeenCalled();
  });
});
