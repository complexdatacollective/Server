import { reduceRight } from 'lodash';

/**
 * Reduce a draft list of resolutions into a list containing only
 * the latest changes
 *
 * @param {Object[]} resolutions list of draft resolutions
 */
const finializeResolutions = (resolutions) => {
  const result = reduceRight(
    resolutions,
    (acc, resolution) => {
      // if any of the nodes in this resolution are accounted for, this resolution is complete
      if (resolution.nodes.some(node => acc.nodes.includes(node))) { return acc; }

      // otherwise collect the resolution, and add the nodes to the account
      return {
        nodes: [...acc.nodes, ...resolution.nodes],
        resolutions: [...acc.resolutions, resolution],
      };
    },
    { nodes: [], resolutions: [] },
  );

  return result.resolutions;
};

export default finializeResolutions;
