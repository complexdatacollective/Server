const { Readable } = require('stream');

const { nodePrimaryKeyProperty } = require('./network');
const { cellValue, csvEOL } = require('./csv');

const asEgoList = network => (
  Array.isArray(network.ego) ? network.ego : [network.ego]
);

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (egos) => {
  const initialHeaderSet = new Set([]);
  initialHeaderSet.add(nodePrimaryKeyProperty);

  const headerSet = egos.reduce((headers, ego) => {
    Object.keys((ego && ego.attributes) || {}).forEach((key) => {
      headers.add(key);
    });
    return headers;
  }, initialHeaderSet);
  return [...headerSet];
};

/**
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
const toCSVStream = (egos, outStream) => {
  const totalRows = egos.length;
  const attrNames = attributeHeaders(egos);
  let headerWritten = false;
  let rowIndex = 0;
  let rowContent;
  let ego;

  const inStream = new Readable({
    read(/* size */) {
      if (!headerWritten) {
        this.push(`${attrNames.map(attr => cellValue(attr)).join(',')}${csvEOL}`);
        headerWritten = true;
      } else if (rowIndex < totalRows) {
        ego = egos[rowIndex] || {};
        const values = attrNames.map((attrName) => {
          // The primary key and ego id exist at the top-level; all others inside `.attributes`
          let value;
          if (attrName === nodePrimaryKeyProperty) {
            value = ego[attrName];
          } else {
            value = ego.attributes[attrName];
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

class EgoListFormatter {
  constructor(data, directed = false, includeEgo = false) {
    this.list = asEgoList(data, directed, includeEgo) || [];
  }
  writeToStream(outStream) {
    // TODO not a list here...somewhere else needs to compile the egos
    return toCSVStream(this.list, outStream);
  }
}


module.exports = {
  EgoListFormatter,
  asEgoList,
  toCSVStream,
};
