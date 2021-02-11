const { Factory } = require('rosie');
const faker = require('faker');

const node = new Factory()
  .sequence('_uid')
  .attr('type', 'person')
  .attr('attributes', () => ({
    name: faker.name.findName(),
    phrase: faker.random.words(),
  }));

module.exports = {
  default: node,
  node,
};
