/* eslint-disable no-param-reassign */ // disabled for reducers
const { resolveOrReject } = require('../utils/db');

// This is a dummy field used for projections when counting network members.
// When we don't need to know anything about members other than size, returning
// an empty dummy field instead of full objects speeds up counting significantly.
const pseudoField = 'nc_pseudo_field';

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
        .projection({ [`data.nodes.${[pseudoField]}`]: 1, _id: 0 })
        .exec(resolveOrReject(docs => resolve(docs.reduce((sum, doc) => {
          sum += doc.data.nodes[pseudoField].length;
          return sum;
        }, 0)), reject));
    });
  }

  countEdges(protocolId) {
    return new Promise((resolve, reject) => {
      this.db
        .find({ protocolId, 'data.edges': { $exists: true } })
        .projection({ [`data.edges.${pseudoField}`]: 1, _id: 0 })
        .exec(resolveOrReject(docs => resolve(docs.reduce((sum, doc) => {
          sum += doc.data.edges[pseudoField].length;
          return sum;
        }, 0)), reject));
    });
  }
};

module.exports = Reportable;
