const { Factory } = require('rosie');
const { times } = require('lodash');

const edge = new Factory()
  .option('range', times(100, (n) => n))
  .option('nodes', null)
  .attr('from', ['nodes', 'range'], (nodes, range) => {
    const ids = nodes ? nodes.map(({ _uid }) => _uid) : range;
    return ids[Math.floor(Math.random() * ids.length)];
  })
  .attr('to', ['nodes', 'range', 'from'], (nodes, range, from) => {
    const ids = nodes ? nodes.map(({ _uid }) => _uid) : range;
    let to = from;
    while (to === from && ids.length > 1) {
      to = ids[Math.floor(Math.random() * ids.length)];
    }
    return to;
  });

module.exports = {
  default: edge,
  edge,
};
