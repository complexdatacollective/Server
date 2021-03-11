/* eslint-disable import/prefer-default-export */

import { selectors as protocolSelectors } from '../../ducks/modules/protocols';

export const getNodeTypes = (state, protocolId) => {
  const nodeDefinitions = protocolSelectors.nodeDefinitions(state, protocolId);

  const options = Object.keys(nodeDefinitions)
    .map(nodeType => ({
      label: nodeDefinitions[nodeType].name,
      value: nodeType,
    }));

  return options;
};
