/* eslint-env jest */

import ResolverManager from '../ResolverManager';

jest.mock('nedb');
jest.mock('electron-log');

jest.mock('../SessionDB', () => (function MockSessionDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
  };
}));

jest.mock('../ResolverDB', () => (function MockResolverDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    getResolutions: jest.fn().mockResolvedValue([]),
  };
}));

describe('ResolverManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ResolverManager('.');
  });

  it('getResolutionsWithSessionCounts() returns resolutions with session counts', async () => {
    const anchorDate = Date.now();
    // This must be decending order
    const resolutions = [
      {
        _id: 2,
        updatedAt: anchorDate + 100,
        transforms: [undefined, undefined],
      },
      {
        _id: 1,
        updatedAt: anchorDate,
        transforms: [undefined, undefined, undefined],
      },
    ];

    manager.db.getResolutions.mockResolvedValueOnce(resolutions);

    const sessions = [
      // resolved
      { updatedAt: anchorDate - 110 }, // 1
      { updatedAt: anchorDate - 110 }, // 1
      { updatedAt: anchorDate - 110 }, // 1
      { updatedAt: anchorDate + 10 }, // 2
      // un resolved
      { updatedAt: anchorDate + 110 },
      { updatedAt: anchorDate + 110 },
    ];

    manager.sessionDb.findAll.mockResolvedValueOnce(sessions);


    await expect(manager.getResolutionsWithSessionCounts(null, null))
      .resolves.toMatchObject({
        resolutions: [
          {
            _id: 2,
            date: anchorDate + 100,
            transforms: [undefined, undefined],
            sessionCount: 1,
          },
          {
            _id: 1,
            date: anchorDate,
            transforms: [undefined, undefined, undefined],
            sessionCount: 3,
          },
        ],
        unresolved: 2,
      });
  });
});
