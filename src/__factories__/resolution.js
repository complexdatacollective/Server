const { Factory } = require('rosie');
const { DateTime } = require('luxon');
const uuid = require('uuid/v4');
const { transform } = require('./transform');

const resolution = new Factory()
  .option('network', null)
  .option('transformCount', null)
  .option('attributes', {})
  .attr('id', () => uuid())
  .sequence('date', i => DateTime.local().minus({ days: i }).toJSDate())
  .attr(
    'transforms',
    ['transformCount', 'network', 'attributes'],
    (transformCount, network, attributes) => {
      const size = transformCount || Math.ceil(network.nodes.length * 0.3);
      return transform.buildList(size, { attributes }, { network });
    },
  );

module.exports = {
  default: resolution,
  resolution,
};
