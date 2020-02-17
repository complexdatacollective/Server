

// [1, 2=

const finializeResolutions = ({ resolutions, ...rest }) => {
  const result = resolutions.reverse()
    .reduce((acc, resolution) => {
      // if any of the nodes in this resolution are accounted for, this resolution is complete
      if (resolution.nodes.some(node => acc.nodes.includes(node))) { return acc; }
      return {
        nodes: [...acc.nodes, ...resolution.nodes],
        resolutions: [...acc.resolutions, resolution],
      };
    }, { nodes: [], resolutions: [] });

  return {
    ...rest,
    resolutions: result.resolutions,
  };
};

export default finializeResolutions;
