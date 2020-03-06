import { Factory } from 'rosie';
import Node from './node';

const resolutionEntry = new Factory()
  .sequence('index')
  .attr('nodes', ['nodes'], (nodes) => {
    if (!nodes) { return Node.buildList(2); }
    return nodes.map(data => Node.attributes(data));
  });

export default resolutionEntry;
