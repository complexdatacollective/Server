
export const exportFormats = [
  {
    label: 'GraphML',
    value: 'GRAPHML',
  },
  {
    label: 'CSV',
    value: 'CSV',
  },
];

const availableCsvTypes = {
  adjacencyMatrix: 'Adjacency Matrix',
  attributeList: 'Attribute List',
  edgeList: 'Edge List',
  egoAttributeList: 'Ego Attribute List',
};

// const defaultCSVOptions = {
//   adjacencyMatrix: false,
//   attributeList: true,
//   edgeList: true,
//   egoAttributeList: true,
// };

// const defaultExportOptions = {
//   exportGraphML: true,
//   exportCSV: defaultCSVOptions,
//   globalOptions: {
//     unifyNetworks: false,
//     useDirectedEdges: false, // TODO
//     useScreenLayoutCoordinates: true,
//     screenLayoutHeight: 1080,
//     screenLayoutWidth: 1920,
//   },
// };

// // Merge default and user-supplied options
// this.exportOptions = {
//   ...defaultExportOptions,
//   ...exportOptions,
//   ...(exportOptions.exportCSV === true ? { exportCSV: defaultCSVOptions } : {}),
// };

const useExportOptions = () => {
  const [optionsState, setOptionsState] = useState({

  });

  const exportFormat = optionsState;

  return [optionsState, setOptionsState, exportFormat];
};
