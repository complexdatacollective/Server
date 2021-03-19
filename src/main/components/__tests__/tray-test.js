/* eslint-env jest */
import { createTray } from '../tray';

jest.mock('electron');

describe('tray', () => {
  it('sets its context menu', () => {
    const tray = createTray();
    expect(tray.setContextMenu).toHaveBeenCalled();
  });

  describe('image', () => {
    let mockPlatform;
    let getTrayImage;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('os', () => ({ platform: () => mockPlatform }));
      getTrayImage = require('../tray').getTrayImage; // eslint-disable-line global-require
    });

    it('has a default', () => {
      expect(getTrayImage()).toMatch('trayDefault.png');
    });

    describe('on windows', () => {
      beforeAll(() => { mockPlatform = 'win32'; });

      it('uses the correct file', () => {
        expect(getTrayImage()).toMatch('trayWindows.png');
      });
    });

    describe('on macOS', () => {
      beforeAll(() => { mockPlatform = 'darwin'; });

      it('uses the correct file', () => {
        expect(getTrayImage()).toMatch('trayTemplate.png');
      });
    });
  });
});
