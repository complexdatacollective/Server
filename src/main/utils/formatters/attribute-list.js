const { Readable } = require('stream');

const { nodePrimaryKeyProperty } = require('./network');
const { cellValue, csvEOL } = require('./csv');

const asAttributeList = nodes => nodes;

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (nodes) => {
  const headerSet = nodes.reduce((headers, node) => {
    Object.keys(node.attributes).forEach((key) => {
      headers.add(key);
    });
    return headers;
  }, new Set([nodePrimaryKeyProperty]));
  return [...headerSet];
};

const toCSVStream = (nodes, outStream) => {
  const totalRows = nodes.length;
  const attrNames = attributeHeaders(nodes);
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
          // The primary key exists at the top-level; all others inside `.attributes`
          let value;
          if (attrName === nodePrimaryKeyProperty) {
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
};

module.exports = {
  asAttributeList,
  toCSVStream,
};