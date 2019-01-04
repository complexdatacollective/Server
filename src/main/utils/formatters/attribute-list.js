const logger = require('electron-log');

const AsyncReadable = require('./AsyncReadable');
const progressEvent = require('./progressEvent');
const { nodePrimaryKeyProperty } = require('./network');
const { cellValue, csvEOL } = require('./csv');

const asAttributeList = network => network.nodes;

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

/**
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
const toCSVStream = (nodes, outStream) => {
  const totalRows = nodes.length;
  const attrNames = attributeHeaders(nodes);
  let headerWritten = false;
  let rowIndex = 0;
  let rowContent;
  let node;

  const inStream = new AsyncReadable({
    read() {
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
        outStream.emit(progressEvent, rowIndex / totalRows);
      } else {
        this.push(null);
        outStream.emit(progressEvent, 1);
      }
    },
  });

  inStream.on('error', (err) => {
    logger.warn('Readable error', err.message);
    logger.debug(err);
  });

  // TODO: handle teardown. Use pipeline() API in Node 10?
  inStream.pipe(outStream);

  return {
    abort: () => { inStream.destroy(); },
  };
};

class AttributeListFormatter {
  constructor(data, directed = false) {
    this.list = asAttributeList(data, directed);
  }
  writeToStream(outStream) {
    return toCSVStream(this.list, outStream);
  }
}


module.exports = {
  AttributeListFormatter,
  asAttributeList,
  toCSVStream,
};
