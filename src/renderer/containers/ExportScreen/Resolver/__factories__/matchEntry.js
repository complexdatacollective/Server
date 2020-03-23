import { Factory } from 'rosie';

const matchEntry = new Factory()
  .sequence('index')
  .attr('action', ['action'], action => (
    action || (Math.random() < 0.5 ? 'resolve' : 'skip')
  ));

export default matchEntry;
