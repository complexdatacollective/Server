const { Factory } = require('rosie');
const { uniq } = require('lodash');
const uuid = require('uuid');

const transform = new Factory()
  .attr('id', () => uuid())
  .option('network', null)
  .attr('nodes', ['network'], (network) => {
    if (!network) { return []; }

    const nodeCount = Math.ceil((network.nodes.length * 0.2 * Math.random()) + 1);

    let nodes = [];
    while (nodes.length < nodeCount) {
      const randomNode = network.nodes[Math.floor(Math.random() * network.nodes.length)];
      // eslint-disable-next-line no-underscore-dangle
      nodes = uniq([...nodes, randomNode._uid]);
    }

    return nodes;
  })
  .attr('attributes', {});

module.exports = {
  default: transform,
  transform,
};
