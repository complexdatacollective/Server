/* eslint-env jest */
import NeDB from 'nedb';
import ReportableMixin from '../Reportable';

const MockDB = class MockDB {
  db = new NeDB({ inMemoryOnly: true })
};

const ReportDB = ReportableMixin(MockDB);

describe('Reportable', () => {
  let reportDB;

  beforeEach(() => {
    reportDB = new ReportDB();
  });

  it('returns counts of the network', async () => {
    await expect(reportDB.totalCounts()).resolves.toMatchObject({
      sessions: 0,
      nodes: 0,
      edges: 0,
    });
  });

  describe('with a throwing DB', () => {
    beforeEach(() => {
      const MockThrowingDB = class MockThrowingDB {
        db = {
          count: jest.fn(() => { throw new Error(); }),
          find: jest.fn(() => { throw new Error(); }),
        }
      };
      const ThrowingReportDB = ReportableMixin(MockThrowingDB);
      reportDB = new ThrowingReportDB();
    });

    it('resolves with NaNs instead of rejecting', async () => {
      await expect(reportDB.totalCounts()).resolves.toEqual({
        sessions: NaN,
        nodes: NaN,
        edges: NaN,
      });
    });
  });
});
