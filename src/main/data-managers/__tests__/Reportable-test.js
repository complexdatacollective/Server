/* eslint-disable max-classes-per-file */
/* eslint-env jest */
import NeDB from 'nedb';
import ReportableMixin from '../Reportable';

import EmptyDataSession from './data/empty-data-session.json';
import EmptyNetworkSession from './data/empty-network-session.json';
import NodesEdgesSession from './data/nodes-edges-session.json';
import TwoNodesEdgesSessions from './data/two-nodes-edges-sessions.json';
import NodeDataSession from './data/node-data-session.json';

const MockDB = class MockDB {
  db = new NeDB({ inMemoryOnly: true, timestampData: true })
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

      it('provides summary stats', async () => {
        await expect(reportDB.summaryStats(mockData.protocolId)).resolves.toMatchObject({
          nodes: { min: 2, max: 2, mean: 2 },
          edges: { min: 2, max: 2, mean: 2 },
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

      // Skip for now: timestamps are still created individually by nedb; mocks may not be equal
      it.skip('merges entity counts when imported at same time', async () => {
        await expect(reportDB.entityTimeSeries(mockData[0].protocolId)).resolves.toHaveLength(1);
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

    describe('with variables', () => {
      beforeAll(() => { mockData = NodeDataSession; });
      it('summarizes an ordinal variable', async () => {
        await expect(reportDB.optionValueBuckets(mockData.protocolId, { person: ['frequencyOrdinal'] }, {}, [])).resolves.toMatchObject({
          nodes: {
            person: {
              frequencyOrdinal: {
                1: 1,
                2: 1,
              },
            },
          },
          edges: {},
          ego: {},
        });
      });

      it('summarizes a categorical variable', async () => {
        await expect(reportDB.optionValueBuckets(mockData.protocolId, { person: ['preferenceCategorical'] }, {}, [])).resolves.toMatchObject({
          nodes: {
            person: {
              preferenceCategorical: {
                a: 2,
                b: 1,
              },
            },
          },
          edges: {},
          ego: {},
        });
      });

      it('summarizes an edge variable', async () => {
        await expect(reportDB.optionValueBuckets(mockData.protocolId, {}, { friend: ['catVariable'] }, [])).resolves.toMatchObject({
          edges: {
            friend: {
              catVariable: {
                1: 1,
                2: 1,
              },
            },
          },
          nodes: {},
          ego: {},
        });
      });

      it('summarizes an ego variable', async () => {
        await expect(reportDB.optionValueBuckets(mockData.protocolId, {}, {}, ['ordVariable'])).resolves.toMatchObject({
          ego: {
            ordVariable: {
              2: 2,
            },
          },
          edges: { friend: {} },
          nodes: { person: {} },
        });
      });

      it('returns entities and keys', async () => {
        await expect(reportDB.entityTimeSeries(mockData.protocolId)).resolves.toMatchObject({
          entities: expect.any(Array),
          keys: expect.any(Array),
        });
      });

      it('produces entity counts as a time series', async () => {
        const result = await reportDB.entityTimeSeries(mockData.protocolId);
        expect(result.entities).toContainEqual({
          time: expect.any(Number),
          edge: 2,
          edge_friend: 2,
          node: 2,
          node_person: 2,
        });
      });

      it('produces keys for all entries in time series', async () => {
        const result = await reportDB.entityTimeSeries(mockData.protocolId);
        expect(result.keys).toContainEqual('node');
        expect(result.keys).toContainEqual('node_person');
        expect(result.keys).toContainEqual('edge');
      });
    });
  });
});
