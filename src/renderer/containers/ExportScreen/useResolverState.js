import { useState } from 'react';

const initialState = {
  resolveRequestId: null,
  matches: [],
  showResolver: false, // export screen state?
  isLoadingMatches: false,
  errorLoadingMatches: null,
};

const useResolverState = () => {
  const [state] = useState(initialState);

  return [state];
};

export default useResolverState;

//   const resolverStream = useRef();
//   const cleanupResolverStream = () => {
//     if (resolverStream.current) {
//       resolverStream.current.abort();
//       resolverStream.current = null;
//     }
//   };

//   const resetResolver = () => {
//     mergeState({
//       matches: [],
//       isLoadingMatches: false,
//       showResolver: false,
//       errorLoadingMatches: null,
//     });

//     cleanupResolverStream();
//   };



//   const handleResolved = (resolutions) => {
//     saveResolution(resolutions)
//       .then(resetResolver);
//   };

//   const handleCancelResolver = () => {
//     resetResolver();
//   };


//   const resolveProtocol = () => {
//     if (!resolverClient) { return Promise.reject(); }

//     const requestId = uuid();

//     const {
//       id: protocolId,
//     } = protocol;

//     const {
//       exportFormat,
//       exportNetworkUnion,
//       csvTypes,
//       useDirectedEdges,
//       useEgoData,
//       entityResolutionOptions,
//     } = exportSettings;

//     const csvTypesNoEgo = new Set(exportSettings.csvTypes);
//     csvTypesNoEgo.delete('ego');
//     const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
//     const showCsvOpts = exportFormat === 'csv';

//     mergeState(({
//       showResolver: true,
//       resolveRequestId: requestId,
//       matches: [],
//       isLoadingMatches: true,
//       errorLoadingMatches: null,
//     }));

//     return resolverClient.resolveProtocol(
//       protocolId,
//       {
//         entityResolutionOptions,
//         exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
//         exportNetworkUnion,
//         useDirectedEdges,
//         useEgoData: useEgoData && showCsvOpts,
//       },
//     )
//       .then(newResolverStream => new Promise((resolve, reject) => {
//         resolverStream.current = newResolverStream;

//         newResolverStream.on('data', (d) => {
//           const data = JSON.parse(d.toString());
//           setState({ ...resolverState, matches: [...resolverState.matches, data] });
//         });

//         newResolverStream.on('end', resolve);

//         newResolverStream.on('error', reject);
//       }))
//       .then(() => {
//         mergeState(({
//           isLoadingMatches: false,
//         }));
//       })
//       .catch((error) => {
//         showError(error.message);

//         mergeState(({
//           isLoadingMatches: false,
//           errorLoadingMatches: error,
//           showResolver: false,
//         }));
//       })
//       .finally(cleanupResolverStream);
//   };

//   const saveResolution = (resolution) => {
//     const {
//       id: protocolId,
//     } = protocol;

//     const {
//       entityResolutionOptions: { entityResolutionPath },
//     } = exportSettings;

//     if (!apiClient) {
//       return Promise.reject();
//     }

//     const options = {
//       entityResolutionPath,
//     };

//     return apiClient
//       .post(`/protocols/${protocolId}/resolutions`, { options, resolution })
//       .then(({ resolutionId }) => {
//         setState({
//           ...resolverState,
//           resolveRequestId: null,
//           entityResolutionOptions: {
//             ...resolverState.entityResolutionOptions,
//             resolutionId,
//             createNewResolution: false,
//           },
//         });
//       })
//       .then(() => promptAndExport())
//       .catch(err => showError(err.message));
//   };

//   resolveRequestId: null,
//   matches: [],
//   showResolver: false,
//   isLoadingMatches: false,
//   errorLoadingMatches: null,
