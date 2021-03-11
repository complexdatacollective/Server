const { Factory } = require('rosie');
const faker = require('faker');
const { node } = require('./node');
const { edge } = require('./edge');

const network = new Factory()
  .option('size', 10)
  .attr('sessionVariables', () => ({
    caseId: faker.random.uuid(),
  }))
  .attr('ego', () => node.build())
  .attr('nodes', ['size'], size => node.buildList(size))
  .attr('edges', ['nodes'], nodes => edge.buildList(Math.ceil(nodes.length / 3), null, { nodes }));

module.exports = {
  default: network,
  network,
};
