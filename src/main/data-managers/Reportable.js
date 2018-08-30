const { resolveWithDocCount, resolveOrReject } = require('../utils/db');

/**
 * Mixin for report queries on a SessionDB.
 */
const Reportable = Super => class extends Super {
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

  countSessions(protocolId) {
    return new Promise((resolve, reject) => {
      this.db.count({ protocolId }, resolveOrReject(resolve, reject));
    });
  }

  countNodes(protocolId) {
    return new Promise((resolve, reject) => {
      this.db
        .find({ protocolId, 'data.nodes': { $exists: true } })
        .projection({ 'data.nodes': 1, _id: 0 })
        .exec(resolveOrReject(resolveWithDocCount(resolve), reject));
    });
  }

  countEdges(protocolId) {
    return new Promise((resolve, reject) => {
      this.db
        .find({ protocolId, 'data.edges': { $exists: true } })
        .projection({ 'data.edges.__countable__': 1, _id: 0 })
        .exec(resolveOrReject(resolveWithDocCount(resolve), reject));
    });
  }
};

module.exports = Reportable;
