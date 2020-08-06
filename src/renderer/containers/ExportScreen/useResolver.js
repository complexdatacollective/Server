import { useRef, useReducer } from 'react';
import uuid from 'uuid';
import resolverClient from '%utils/resolverClient';

const initialState = {
  initialState: true,
  resolveRequestId: null,
  matches: [],
  showResolver: false,
  isLoadingMatches: false,
  errorLoadingMatches: null,
};

function stateReducer(state, action) {
  switch (action.type) {
    case 'UPDATE':
      return {
        ...state,
        ...action.payload,
      };
    case 'ADD_MATCH':
      return {
        ...state,
        matches: [...state.matches, action.payload],
      };
    default:
      throw new Error();
  }
}

const useResolver = (showError) => {
  const resolverResults = useRef(null);
  const client = useRef(resolverClient);
  const [state, dispatch] = useReducer(stateReducer, initialState);

  const addMatch = data =>
    dispatch({ type: 'ADD_MATCH', payload: data });

  const updateState = props =>
    dispatch({ type: 'UPDATE', payload: props });

  const cleanupResolverStream = () => {
    if (resolverResults.current) {
      // resolverResults.current.abort();
      resolverResults.current = null;
    }
  };

  const reset = () => {
    updateState({
      isLoadingMatches: false,
      showResolver: false,
      resolveRequestId: null,
      errorLoadingMatches: null,
      matches: [],
    });

    cleanupResolverStream();
  };

  const resolveProtocol = (protocol, exportSettings) => {
    if (!client.current) { return Promise.reject(); }

    if (state.resolveRequestId) { return Promise.reject(); }

    const requestId = uuid();

    const {
      id: protocolId,
    } = protocol;

    const {
      exportFormat,
      exportNetworkUnion,
      csvTypes,
      useDirectedEdges,
      useEgoData,
      resolutionId,
      egoCastType,
      entityResolutionArguments,
      entityResolutionPath,
    } = exportSettings;

    const csvTypesNoEgo = new Set(exportSettings.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    updateState({
      initialState: false,
      showResolver: true,
      resolveRequestId: requestId,
      isLoadingMatches: true,
      errorLoadingMatches: null,
      matches: [],
    });

    return client.current.resolveProtocol(
      protocolId,
      {
        resolutionId,
        enableEntityResolution: true,
        entityResolutionArguments,
        entityResolutionPath,
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        useDirectedEdges,
        egoCastType,
        useEgoData: useEgoData && showCsvOpts,
      },
    )
      .then(result => new Promise((resolve, reject) => {
        resolverResults.current = result;

        result.on('match', (d) => {
          const data = JSON.parse(d.toString());

          addMatch(data);
        });

        result.on('end', resolve);

        result.on('error', reject);
      }))
      .then(() => updateState({
        isLoadingMatches: false,
      }))
      .catch((error) => {
        const message = error.message || error.toString();
        showError(message);

        updateState({
          errorLoadingMatches: error,
          matches: [],
          showResolver: false,
          resolveRequestId: null,
        });
      })
      .finally(cleanupResolverStream);
  };

  return [
    state,
    resolveProtocol,
    reset,
  ];
};

export default useResolver;
