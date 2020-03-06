const { Factory } = require('rosie');
const { DateTime } = require('luxon');
const uuid = require('uuid');
const { transform } = require('./transform');

const resolution = new Factory()
  .option('network', null)
  .option('attributes', {})
  .attr('id', () => uuid())
  .sequence('date', i => DateTime.local().minus({ days: i }).toISO())
  .attr('transforms', ['network', 'attributes'], (network, attributes) => {
    const size = network ? Math.ceil(network.nodes.length * 0.3) : 3;
    return transform.buildList(size, { attributes }, { network });
  });

module.exports = {
  default: resolution,
  resolution,
};
