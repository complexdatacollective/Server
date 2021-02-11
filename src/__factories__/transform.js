const { Factory } = require('rosie');
const { uniq } = require('lodash');
const uuid = require('uuid');

const transform = new Factory()
  .attr('id', () => uuid())
  .option('network', null)
  .option('nodes', null)
  .attr('nodes', ['network', 'nodes'], (network, nodes) => {
    if (nodes) { return nodes; }
    if (!network) { return []; }

    const nodeCount = Math.ceil((network.nodes.length * 0.3 * Math.random()) + 1);

    let networkNodes = [];

    while (networkNodes.length < nodeCount) {
      const randomNode = network.nodes[Math.floor(Math.random() * network.nodes.length)];
      // eslint-disable-next-line no-underscore-dangle
      networkNodes = uniq([...networkNodes, randomNode._uid]);
    }

    return networkNodes;
  })
  .attr('attributes', {});

module.exports = {
  default: transform,
  transform,
};
