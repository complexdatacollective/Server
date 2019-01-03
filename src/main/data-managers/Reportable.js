/* eslint-disable no-param-reassign */ // disabled for reducers
const attributesProperty = require('../utils/network-query/nodeAttributesProperty');
const { resolveOrReject } = require('../utils/db');

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
   * Count occurences of ordinal values in the study for a histogram.
   * @param  {string} protocolId
   * @param  {string} ordinalVariableName
   * @param  {string} entityName='node' Possible values: 'node', 'edge'.
   * @param  {string} entityType=null If given, filter all nodes by the given type first.
   *                                  This may be needed if variable names overlap,
   *                                  since variable IDs aren't exported.
   * @return {Object} buckets keyed by ordinal value, with count values
   */
  ordinalBuckets(protocolId, ordinalVariableName, entityName = 'node', entityType = null) {
    return new Promise((resolve, reject) => {
      const key = entityKey(entityName);
      this.db.find({ protocolId, [`data.${key}`]: { $exists: true } }, resolveOrReject((docs) => {
        let entities = flatten(docs.map(doc => doc.data[key]));
        if (entityType) {
          entities = entities.filter(entity => entity.type === entityType);
        }
        const buckets = entities.reduce((acc, entity) => {
          const ordValue = entity[attributesProperty][ordinalVariableName];
          if (ordValue !== undefined) {
            acc[ordValue] = acc[ordValue] || 0;
            acc[ordValue] += 1;
          }
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
