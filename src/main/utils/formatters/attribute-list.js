const { Readable } = require('stream');

const { nodePrimaryKeyProperty } = require('./network');
const { cellValue, csvEOL } = require('./csv');

const asAttributeList = network => network.nodes;

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (nodes, withEgo) => {
  const initialHeaderSet = new Set([]);
  if (withEgo) {
    initialHeaderSet.add('_egoID');
  }
  initialHeaderSet.add(nodePrimaryKeyProperty);

  const headerSet = nodes.reduce((headers, node) => {
    Object.keys(node.attributes || []).forEach((key) => {
      headers.add(key);
    });
    return headers;
  }, initialHeaderSet);
  return [...headerSet];
};

/**
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
const toCSVStream = (nodes, outStream, withEgo = false) => {
  const totalRows = nodes.length;
  const attrNames = attributeHeaders(nodes, withEgo);
  let headerWritten = false;
  let rowIndex = 0;
  let rowContent;
  let node;

  const inStream = new Readable({
    read(/* size */) {
      if (!headerWritten) {
        this.push(`${attrNames.map(attr => cellValue(attr)).join(',')}${csvEOL}`);
        headerWritten = true;
      } else if (rowIndex < totalRows) {
        node = nodes[rowIndex];
        const values = attrNames.map((attrName) => {
          // The primary key and ego id exist at the top-level; all others inside `.attributes`
          let value;
          if (attrName === nodePrimaryKeyProperty || attrName === '_egoID') {
            value = node[attrName];
          } else {
            value = node.attributes[attrName];
          }
          return cellValue(value);
        });
        rowContent = `${values.join(',')}${csvEOL}`;
        this.push(rowContent);
        rowIndex += 1;
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

class AttributeListFormatter {
  constructor(data, directed = false, includeEgo = false) {
    this.list = asAttributeList(data, directed, includeEgo) || [];
    this.includeEgo = includeEgo;
  }
  writeToStream(outStream) {
    return toCSVStream(this.list, outStream, this.includeEgo);
  }
}


module.exports = {
  AttributeListFormatter,
  asAttributeList,
  toCSVStream,
};
