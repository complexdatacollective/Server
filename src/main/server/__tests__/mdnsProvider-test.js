/* eslint-env jest */
/* eslint-disable global-require */

const mockMdns = {};
const mockLoadError = new Error('error loading module');

jest.mock('electron-log');

describe('mdnsProvider', () => {
  describe('when MDNS available', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.doMock('mdns', () => mockMdns);
    });

    it('', () => {
      const mdnsProvider = require('../mdnsProvider');
      expect(mdnsProvider.mdnsIsSupported).toBe(true);
      expect(mdnsProvider.mdns).toBe(mockMdns);
    });
  });

  describe('when MDNS throws on require', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.doMock('mdns', () => {
        throw mockLoadError;
      });
    });

    it('', () => {
      const mdnsProvider = require('../mdnsProvider');
      expect(mdnsProvider.mdnsIsSupported).toBe(false);
      expect(mdnsProvider.mdns).toBe(null);
    });
  });
});
