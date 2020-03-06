const { edge } = require('./edge');
const { node } = require('./node');
const { network } = require('./network');
const { session } = require('./session');
const { transform } = require('./transform');
const { resolution } = require('./resolution');

const Factory = {
  edge,
  node,
  network,
  session,
  transform,
  resolution,
};

module.exports = {
  Factory,
  default: Factory,
};
