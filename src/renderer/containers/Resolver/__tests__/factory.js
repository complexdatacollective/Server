import { Factory } from 'rosie';

Factory.define('resolution')
  .sequence('matchIndex')
  .option('getHistory', () => (['a', 'b']))
  .attr('nodes',
    ['matchIndex', 'getHistory'],
    (matchIndex, getHistory) => getHistory(matchIndex),
  )
  .attr('attributes', {});

export default Factory;
