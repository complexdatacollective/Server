const { Factory } = require('rosie');

const node = new Factory()
  .sequence('_uid')
  .attr('attributes', {});

module.exports = {
  default: node,
  node,
};
