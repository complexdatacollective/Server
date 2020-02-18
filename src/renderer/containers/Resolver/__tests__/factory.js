import { Factory } from 'rosie';

Factory.define('node')
  .sequence('id')
  .attr('attributes', {});

Factory.define('match')
  .sequence('index')
  .attr('nodes', ['nodes'], (nodes) => {
    if (!nodes) { return Factory.buildList('node', 2); }
    return nodes.map(data => Factory.attributes('node', data));
  });

Factory.define('resolutionEntry')
  .sequence('matchIndex')
  .attr('nodes', ['matchIndex', 'nodes'], (matchIndex, nodes) => {
    if (nodes) { return nodes; }
    return [(matchIndex * 2) - 1, matchIndex * 2];
  })
  .attr('attributes', {});

Factory.define('matchEntry')
  .sequence('index')
  .attr('action', ['action'], action => (
    action || (Math.random() < 0.5 ? 'resolve' : 'skip')
  ));

export default Factory;
