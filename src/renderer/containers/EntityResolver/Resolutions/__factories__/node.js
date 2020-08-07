import { Factory } from 'rosie';

const node = new Factory()
  .sequence('_uid')
  .attr('attributes', {});

export default node;
