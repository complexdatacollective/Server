/* eslint-env jest */
import NeDB from 'nedb';
import ReportableMixin from '../Reportable';

import EmptyDataSession from './data/empty-data-session.json';
import EmptyNetworkSession from './data/empty-network-session.json';
import NodesEdgesSession from './data/nodes-edges-session.json';
import TwoNodesEdgesSessions from './data/two-nodes-edges-sessions.json';

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

  describe('dataset', () => {
    let mockData;
    beforeEach((done) => { reportDB.db.insert(mockData, () => done()); });
    afterEach((done) => { reportDB.db.remove({}, { multi: true }, () => done()); });

    describe('with nodes & edges', () => {
      beforeAll(() => { mockData = NodesEdgesSession; });
      it('counts nodes and edges', async () => {
        await expect(reportDB.totalCounts(mockData.protocolId)).resolves.toMatchObject({
          sessions: 1,
          nodes: mockData.data.nodes.length,
          edges: mockData.data.edges.length,
        });
      });
    });

    describe('with multiple sessions', () => {
      beforeAll(() => { mockData = TwoNodesEdgesSessions; });
      it('counts nodes and edges', async () => {
        await expect(reportDB.totalCounts(mockData[0].protocolId)).resolves.toMatchObject({
          sessions: 2,
          nodes: NodesEdgesSession.data.nodes.length * 2,
          edges: NodesEdgesSession.data.edges.length * 2,
        });
      });
    });

    describe('with empty nodes & edges', () => {
      beforeAll(() => { mockData = EmptyNetworkSession; });
      it('counts nodes and edges', async () => {
        await expect(reportDB.totalCounts(mockData.protocolId)).resolves.toMatchObject({
          nodes: 0,
          edges: 0,
        });
      });
    });

    describe('with no network', () => {
      beforeAll(() => { mockData = EmptyDataSession; });
      it('counts nodes and edges', async () => {
        await expect(reportDB.totalCounts(mockData.protocolId)).resolves.toMatchObject({
          nodes: 0,
          edges: 0,
        });
      });
    });
  });
});
