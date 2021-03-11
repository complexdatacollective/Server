const { Factory } = require('rosie');
const { DateTime } = require('luxon');
const { network } = require('./network');

const session = new Factory().extend(network)
  .sequence('date', i => DateTime.local().minus({ days: i }).toJSDate());

module.exports = {
  default: session,
  session,
};
