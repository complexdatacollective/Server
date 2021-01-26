import { useState } from 'react';
import { set, pick } from 'lodash';

// `exportOptions` defaults:
// {
//   exportGraphML: true,
//   exportCSV: {
//      adjacencyMatrix: false,
//      attributeList: true,
//      edgeList: true,
//      egoAttributeList: true,
//   },
//   globalOptions: {
//     unifyNetworks: false,
//     useDirectedEdges: false, // TODO
//     useScreenLayoutCoordinates: true,
//     screenLayoutHeight: 1080,
//     screenLayoutWidth: 1920,
//   },
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
  egoAttributeList: true,
};

const initialState = {
  exportFormats: ['GRAPHML', 'CSV'],
  unifyNetworks: false,
  useScreenLayoutCoordinates: false,
  screenLayoutHeight: 1080,
  screenLayoutWidth: 1920,
  adjacencyMatrix: false,
  attributeList: true,
  edgeList: true,
  egoAttributeList: true,
  resolverSettings: {},
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

  const resolverSettings = formState.resolverSettings;

  const exportOptions = {
    exportGraphML: formState.exportFormats.includes('GRAPHML'),
    exportCSV: !formState.exportFormats.includes('CSV') ? false : exportCSVOptions,
    globalOptions,
    resolveEntities: resolverSettings.selectedResolution ? resolverSettings : false,
  };

  return [exportOptions, formState, handleUpdateFormState];
};

export default useExportOptions;
