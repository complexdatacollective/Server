import { useRef, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import uuid from 'uuid';
import resolverClient from '%utils/resolverClient';
import { actionCreators as dialogActions } from '%modules/dialogs';

const initialState = {
  protocol: null,
  initialState: true,
  resolveRequestId: null,
  matches: [],
  showResolver: false,
  isLoadingMatches: false,
  errorLoadingMatches: null,
};

const resolverReducer = (state, action) => {
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
};

const useResolver = () => {
  const resolverResults = useRef(null);
  const dispatch = useDispatch();

  const client = useRef(resolverClient);
  const [resolverState, resolverDispatch] = useReducer(resolverReducer, initialState);

  const addMatch = data =>
    resolverDispatch({ type: 'ADD_MATCH', payload: data });

  const updateState = props =>
    resolverDispatch({ type: 'UPDATE', payload: props });

  const cleanupResolverStream = () => {
    if (resolverResults.current) {
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
      protocol: null,
    });

    cleanupResolverStream();
  };

  const resolveProtocol = (protocol, exportSettings) => {
    if (!client.current) { return Promise.reject(); }

    if (resolverState.resolveRequestId) { return Promise.reject(); }

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
      protocol,
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

        result.on('match', addMatch);

        result.on('end', resolve);

        result.on('error', reject);
      }))
      .then(() => updateState({
        isLoadingMatches: false,
      }))
      .catch((error) => {
        dispatch(dialogActions.openDialog({
          type: 'Error',
          error,
        }));

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
    resolverState,
    resolveProtocol,
    reset,
  ];
};

export default useResolver;
