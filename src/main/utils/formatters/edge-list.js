const { Readable } = require('stream');

const { cellValue, csvEOL } = require('./csv');
const { nodePrimaryKeyProperty, egoProperty, nodeAttributesProperty } = require('./network');

/**
 * Builds an edge list for a network, based only on its edges (it need
 * not contain all nodes). Each row contains two nodes; nodes in each column may be duplicated.
 *
 * Note that duplicate edges (e.g., of different types) are not conveyed in the output.
 *
 * @example
 * ```
 * | from | to   |
 * | a    | b    |
 * | a    | c    |
 * | b    | a    |
 * | c    | a    |
 * ```
 *
 * @param  {Object} network NC network containing edges
 * @param  {Boolean} directed if false, adjacencies are represented in both directions
 *                            default: false
 * @return {Array} the edges list
 */
const asEdgeList = (network, directed = false) => {
  if (directed === false) {
    // this may change if we have support for directed vs undirected edges in NC
    return (network.edges || []).reduce((arr, edge) => (
      arr.concat(
        { ...edge, to: edge.to, from: edge.from },
        { ...edge, to: edge.from, from: edge.to },
      )
    ), []);
  }
  return network.edges;
};

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (edges, withEgo) => {
  const initialHeaderSet = new Set([]);
  if (withEgo) {
    initialHeaderSet.add(egoProperty);
  }
  initialHeaderSet.add(nodePrimaryKeyProperty);
  initialHeaderSet.add('from');
  initialHeaderSet.add('to');

  const headerSet = edges.reduce((headers, edge) => {
    Object.keys(edge[nodeAttributesProperty] || []).forEach((key) => {
      headers.add(key);
    });
    return headers;
  }, initialHeaderSet);
  return [...headerSet];
};

const getPrintableAttribute = (attribute) => {
  switch (attribute) {
    case egoProperty:
      return 'networkCanvasEgoID';
    case nodePrimaryKeyProperty:
      return 'networkCanvasEdgeID';
    case 'from':
      return 'networkCanvasSource';
    case 'to':
      return 'networkCanvasTarget';
    default:
      return attribute;
  }
};

/**
 * Write a CSV reprensentation of the list to the given Writable stream.
 *
 * @example
 * ```
 * a,b
 * a,c
 * b,a
 * c,a
 * ```
 *
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
const toCSVStream = (edges, outStream, withEgo = false) => {
  const totalChunks = edges.length;
  let chunkContent;
  let chunkIndex = 0;
  const attrNames = attributeHeaders(edges, withEgo);
  let headerWritten = false;
  let edge;

  const inStream = new Readable({
    read(/* size */) {
      if (!headerWritten) {
        this.push(`${attrNames.map(attr => cellValue(getPrintableAttribute(attr))).join(',')}${csvEOL}`);
        headerWritten = true;
      } else if (chunkIndex < totalChunks) {
        edge = edges[chunkIndex];
        const values = attrNames.map((attrName) => {
          // primary key/ego id/to/from exist at the top-level; all others inside `.attributes`
          let value;
          if (attrName === nodePrimaryKeyProperty || attrName === egoProperty ||
            attrName === 'to' || attrName === 'from') {
            value = edge[attrName];
          } else {
            value = edge[nodeAttributesProperty][attrName];
          }
          return cellValue(value);
        });
        chunkContent = `${values.join(',')}${csvEOL}`;
        this.push(chunkContent);
        chunkIndex += 1;
      } else {
        this.push(null);
      }
    },
  });

  // TODO: handle teardown. Use pipeline() API in Node 10?
  inStream.pipe(outStream);

  return {
    abort: () => { inStream.destroy(); },
  };
};

class EdgeListFormatter {
  constructor(data, directed = false, includeEgo = false) {
    this.list = asEdgeList(data, directed, includeEgo);
    this.includeEgo = includeEgo;
  }
  writeToStream(outStream) {
    return toCSVStream(this.list, outStream, this.includeEgo);
  }
}

module.exports = {
  EdgeListFormatter,
  asEdgeList,
  toCSVStream,
};
