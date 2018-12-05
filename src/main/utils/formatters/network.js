// TODO: share with other places this is defined
const nodePrimaryKeyProperty = '_uid';

const nodeAttributesProperty = 'attributes';

const getNodeAttributes = node => node[nodeAttributesProperty] || {};

module.exports = {
  getNodeAttributes,
  nodeAttributesProperty,
  nodePrimaryKeyProperty,
};
