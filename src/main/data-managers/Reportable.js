/* eslint-disable no-param-reassign */ // disabled for reducers
const attributesProperty = require('../utils/network-query/nodeAttributesProperty');
const { leastRecent, resolveOrReject } = require('../utils/db');

// This is a dummy field used for projections when counting network members.
// When we don't need to know anything about members other than size, returning
// an empty dummy field instead of full objects speeds up counting significantly.
const pseudoField = 'nc_pseudo_field';

// Map document results to a count of contained edges *for each interview*
const edgeCounts = docs => docs.map(doc => doc.data.edges[pseudoField].length);

// As above, but for nodes
const nodeCounts = docs => docs.map(doc => doc.data.nodes[pseudoField].length);

// Return min/mean/max based on entityCounts (# of nodes or edges per interview)
const summaryStats = (entityCounts) => {
  const stats = entityCounts.reduce((acc, count) => {
    acc.sum += count;
    acc.min = Math.min(acc.min, count);
    acc.max = Math.max(acc.max, count);
    return acc;
  }, { min: Infinity, max: 0, sum: 0 });
  stats.mean = stats.sum / entityCounts.length;
  return stats;
};

const flatten = shallowArrays => [].concat(...shallowArrays);

const entityKey = (entityName) => {
  if (entityName === 'node') return 'nodes';
  if (entityName === 'edge') return 'edges';
  return null;
};

// Count entities by type, accumulating in an object.
// See entityTimeSeries for the format of `types
const reduceEntityTypeCounts = (types = [], entityName = 'node') =>
  types.reduce((sumMap, type) => {
    const typeKey = `node_${type}`;
    sumMap[typeKey] = sumMap[typeKey] || 0;
    sumMap[typeKey] += 1;
    sumMap[entityName] += 1;
    return sumMap;
  }, { [entityName]: 0 });

/**
 * Mixin for report queries on a SessionDB.
 */
const Reportable = Super => class extends Super {
  summaryStats(protocolId) {
    return Promise.all(
      [
        this.nodeStats(protocolId).catch(() => {}),
        this.edgeStats(protocolId).catch(() => {}),
      ])
      .then(([nodes, edges]) => ({ nodes, edges }));
  }

  /**
   * Collect counts of each entity ('node', 'edge') and type ('person', etc.) segmented
   * by creation date.
   *
   * An input [DB] record is of the format:
   * ```
   * {
   *   "data": {
   *     "edges": {"type":["friend", undefined]},
   *     "nodes": {"type":["person", "venue"]}
   *   },
   *   "createdAt":"2019-01-01T11:11:11Z"
   * }
   * ```
   *
   * This is mapped to the following entry, which is tailored to the recharts (render) format:
   * ```
   * {
   *   time: 1546341071000,
   *   node: 2,
   *   node_person: 1,
   *   node_venue: 1,
   *   edge: 2,
   *   edge_friend: 1
   * }
   * ```
   *
   * Note that the render format requires a Number for the time value.
   *
   * @param {string} protocolId
   * @return {Array} entries in the format described above
   */
  entityTimeSeries(protocolId) {
    return new Promise((resolve, reject) => {
      let cursor = this.db.find({ protocolId });
      cursor = cursor.projection({ 'data.edges.type': 1, 'data.nodes.type': 1, createdAt: 1, _id: 0 });
      cursor = cursor.sort(leastRecent);
      cursor.exec(resolveOrReject(((records) => {
        resolve(records.reduce((entries, record) => {
          const { edges: { type: edgeTypes } = {}, nodes: { type: nodeTypes } = {} } = record.data;
          const time = record.createdAt.getTime();
          const nodeTypeCounts = reduceEntityTypeCounts(nodeTypes, 'node');
          const edgeTypeCounts = reduceEntityTypeCounts(edgeTypes, 'edge');

          const prevEntry = entries.length && entries[entries.length - 1];
          if (prevEntry.time === time) {
            // If two sessions have the same import time, merge.
            // (We may support batch imports in the future.)
            Object.entries({ ...nodeTypeCounts, ...edgeTypeCounts }).forEach(([key, value]) => {
              prevEntry[key] = prevEntry[key] || 0;
              prevEntry[key] += value;
            });
          } else {
            entries.push({
              time,
              ...nodeTypeCounts,
              ...edgeTypeCounts,
            });
          }
          return entries;
        }, []));
      }), reject));
    });
  }

  totalCounts(protocolId) {
    return Promise.all(
      [
        this.countSessions(protocolId).catch(() => NaN),
        this.countNodes(protocolId).catch(() => NaN),
        this.countEdges(protocolId).catch(() => NaN),
      ])
      .then((([sessions, nodes, edges]) => ({
        sessions,
        nodes,
        edges,
      })));
  }

  /**
   * Count occurences of ordinal or categorical values in the study for a histogram.
   * Counts are returned for each variableName requested, regardless of entity type.
   * variableNames are grouped by entityType, since names may conflict.
   *
   * @param  {string} protocolId
   * @param  {Array} variableNames the ordinal or categorial variable names to count
   * @param  {string} entityName='node' Possible values: 'node', 'edge'.
   * @return {Object} buckets keyed by ordinal/cardinal value, with count values
   *
   * @example
   * ```
   * { person: { contactFrequency: { 1: 1, 2: 4 } } }
   * ```
   */
  optionValueBuckets(protocolId, variableNames, entityName = 'node') {
    return new Promise((resolve, reject) => {
      const key = entityKey(entityName);
      this.db.find({ protocolId, [`data.${key}`]: { $exists: true } }, resolveOrReject((docs) => {
        const entities = flatten(docs.map(doc => doc.data[key]));
        const buckets = entities.reduce((acc, entity) => {
          acc[entity.type] = acc[entity.type] || {};
          variableNames.forEach((variableName) => {
            acc[entity.type][variableName] = acc[entity.type][variableName] || {};
            const optionValue = entity[attributesProperty][variableName];
            if (optionValue !== undefined) {
              // Categorical values are expressed as arrays of multiple options
              const optionValues = (optionValue instanceof Array) ? optionValue : [optionValue];
              const counts = acc[entity.type][variableName];
              optionValues.forEach((value) => {
                counts[value] = counts[value] || 0;
                counts[value] += 1;
              });
            }
          });
          return acc;
        }, {});
        resolve(buckets);
      }, reject));
    });
  }

  nodeStats(protocolId) {
    return new Promise((resolve, reject) => {
      this.db
        .find({ protocolId, 'data.nodes': { $exists: true } })
        .projection({ [`data.nodes.${[pseudoField]}`]: 1, _id: 0 })
        .exec(resolveOrReject(docs => resolve(summaryStats(nodeCounts(docs))), reject));
    });
  }

  edgeStats(protocolId) {
    return new Promise((resolve, reject) => {
      this.db
        .find({ protocolId, 'data.edges': { $exists: true } })
        .projection({ [`data.edges.${[pseudoField]}`]: 1, _id: 0 })
        .exec(resolveOrReject(docs => resolve(summaryStats(edgeCounts(docs))), reject));
    });
  }

  countSessions(protocolId) {
    return new Promise((resolve, reject) => {
      this.db.count({ protocolId }, resolveOrReject(resolve, reject));
    });
  }

  countNodes(protocolId) {
    return this.nodeStats(protocolId).then(stats => stats && stats.sum);
  }

  countEdges(protocolId) {
    return this.edgeStats(protocolId).then(stats => stats && stats.sum);
  }
};

module.exports = Reportable;
