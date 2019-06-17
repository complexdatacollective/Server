const { Readable } = require('stream');

const { convertUuidToDecimal, nodePrimaryKeyProperty, nodeAttributesProperty, entityTypeProperty, egoProperty, processEntityVariables } = require('./network');
const { cellValue, csvEOL } = require('./csv');

const asAttributeList = (network, _, codebook) => {
  const processedNodes = (network.nodes || []).map((node) => {
    if (codebook && codebook.node[node.type]) {
      return processEntityVariables(node, codebook.node[node.type].variables);
    }
    return node;
  });
  return processedNodes;
};

/**
 * The output of this formatter will contain the primary key (_uid)
 * and all model data (inside the `attributes` property)
 */
const attributeHeaders = (nodes, withEgo) => {
  const initialHeaderSet = new Set([]);
  if (withEgo) {
    initialHeaderSet.add(egoProperty);
  }
  initialHeaderSet.add(nodePrimaryKeyProperty);
  initialHeaderSet.add(entityTypeProperty);

  const headerSet = nodes.reduce((headers, node) => {
    Object.keys(node[nodeAttributesProperty] || []).forEach((key) => {
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
      return 'networkCanvasAlterID';
    case entityTypeProperty:
      return 'networkCanvasNodeType';
    default:
      return attribute;
  }
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
        this.push(`${attrNames.map(attr => cellValue(getPrintableAttribute(attr))).join(',')}${csvEOL}`);
        headerWritten = true;
      } else if (rowIndex < totalRows) {
        node = nodes[rowIndex];
        const values = attrNames.map((attrName) => {
          // The primary key and ego id exist at the top-level; all others inside `.attributes`
          let value;
          if (attrName === nodePrimaryKeyProperty || attrName === egoProperty) {
            value = convertUuidToDecimal(node[attrName]);
          } else if (attrName === entityTypeProperty) {
            value = node.type;
          } else {
            value = node[nodeAttributesProperty][attrName];
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
  constructor(data, directed = false, includeEgo = false, codebook) {
    this.list = asAttributeList(data, directed, codebook) || [];
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
