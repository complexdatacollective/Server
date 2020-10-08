import { useState } from 'react';
import { set, pick } from 'lodash';

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

export const exportFormats = [
  { value: 'GRAPHML', label: 'GraphML' },
  { value: 'CSV', label: 'CSV' },
];

const baseGlobalOptions = {
  unifyNetworks: false,
  useDirectedEdges: false,
  useScreenLayoutCoordinates: false,
  screenLayoutHeight: null,
  screenLayoutWidth: null,
};

const baseCSVOptions = {
  adjacencyMatrix: false,
  attributeList: false,
  edgeList: false,
  egoAttributeList: false,
};

const initialState = {
  exportFormats: ['GRAPHML', 'CSV'],
  unifyNetworks: false,
  useScreenLayoutCoordinates: true,
  screenLayoutHeight: 1080,
  screenLayoutWidth: 1920,
  adjacencyMatrix: false,
  attributeList: true,
  edgeList: true,
  egoAttributeList: true,
};

const useExportOptions = () => {
  const [formState, setFormState] = useState({ ...initialState });

  const handleUpdateFormState = (key, value) => {
    setFormState(s => ({ ...set(s, key, value) }));
  };

  const exportCSVOptions = {
    ...baseCSVOptions,
    ...pick(formState, Object.keys(baseCSVOptions)),
  };

  const globalOptions = {
    ...baseGlobalOptions,
    ...pick(formState, Object.keys(baseGlobalOptions)),
  };

  const exportOptions = {
    exportGraphML: formState.exportFormats.includes('GRAPHML'),
    exportCSV: !formState.exportFormats.includes('CSV') ? false : exportCSVOptions,
    globalOptions,
  };

  return [exportOptions, formState, handleUpdateFormState];
};

export default useExportOptions;