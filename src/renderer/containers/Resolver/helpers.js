import { nodePrimaryKeyProperty } from '../../../main/utils/formatters/network';

export const getMatch = (matches, index) => {
  if (matches.length < index + 1) { return null; }

  return {
    ...matches[index],
    index,
  };
};

export const getMatchOrResolved = (match, resolutions) => {
  if (!match) { return null; }

  const reversedResolutions = [...resolutions].reverse();

  const nodes = match.nodes.map((node) => {
    const resolution = reversedResolutions
      .find(r => r.nodes.includes(node[nodePrimaryKeyProperty]));

    if (!resolution) { return node; }

    return {
      ...node,
      attributes: resolution.attributes,
    };
  });

  return {
    ...match,
    nodes,
  };
};
