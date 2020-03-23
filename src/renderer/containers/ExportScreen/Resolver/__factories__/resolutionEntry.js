/* eslint-disable no-underscore-dangle */

import { Factory } from 'rosie';

const resolutionEntry = new Factory()
  .sequence('matchIndex')
  .attr('nodes', ['nodes'], (nodes) => {
    if (!nodes) { return [1, 2]; }
    if (!nodes[0]._uid) { return nodes; }
    return nodes.map(({ _uid }) => _uid);
  });

export default resolutionEntry;
