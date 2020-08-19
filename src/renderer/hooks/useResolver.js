import { useRef, useReducer, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { isEmpty } from 'lodash';
import resolverClient from '%utils/resolverClient';
import { actionCreators as dialogActions } from '%modules/dialogs';

const initialState = {
  protocol: null,
  requestId: null,
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
    case 'RESET':
      return (
        action.payload.hard ?
          { ...initialState } :
          {
            ...state,
            protocol: null,
            isLoadingMatches: false,
            showResolver: false,
            errorLoadingMatches: null,
            matches: [],
          }
      );
    default:
      throw new Error();
  }
};

const useResolver = () => {
  const dispatch = useDispatch();
  const resolver = useRef(null);
  const [resolverState, resolverDispatch] = useReducer(resolverReducer, initialState);

  const addMatch = data =>
    resolverDispatch({ type: 'ADD_MATCH', payload: data });

  const updateState = props =>
    resolverDispatch({ type: 'UPDATE', payload: props });

  const resetState = (hard = false) =>
    resolverDispatch({ type: 'RESET', payload: { hard } });

  const abortResolver = () => {
    if (!resolver.current) { return; }
    resolver.current.abort();
  };

  const cleanupResolver = () => {
    if (!resolver.current) { return; }
    abortResolver(); // may not be neccessary if we quit, but otherwise
    resolver.current.removeAllListeners('match');
    resolver.current.removeAllListeners('end');
    resolver.current.removeAllListeners('error');
    resolver.current = null;
  };

  const handleEnd = () => {
    updateState({ isLoadingMatches: false });
    cleanupResolver();
  };

  const handleError = (error) => {
    dispatch(dialogActions.openDialog({
      type: 'Error',
      error,
    }));

    updateState({
      errorLoadingMatches: error,
      matches: [],
      showResolver: false,
    });
  };

  const setResolver = (nextResolver) => {
    cleanupResolver();

    if (!nextResolver) { return; }

    resolver.current = nextResolver;

    resolver.current.on('match', addMatch);
    resolver.current.on('end', handleEnd);
    resolver.current.on('error', handleError);
  };

  const handleResolve = protocol =>
    (client) => {
      // clean up old resolver
      setResolver(client.resolver);

      updateState({
        protocol,
        showResolver: true,
        isLoadingMatches: true,
        requestId: client.requestId,
      });
    };

  const cancelResolver = () => {
    resetState();
    cleanupResolver();
  };

  // cleanup on unmount
  useEffect(() => () => cleanupResolver(), []);

  const resolveProtocol = (protocol, exportSettings) => {
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

    if (isEmpty(egoCastType)) {
      handleError(new Error('Please specify an ego cast type'));
      return;
    }
    
    if (isEmpty(entityResolutionPath)) {
      handleError(new Error('Please specify a resolver path'));
      return;
    }

    return resolverClient(
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
      .then(handleResolve(protocol))
      .catch(handleError);
  };

  return [
    resolverState,
    resolveProtocol,
    cancelResolver,
  ];
};

export default useResolver;
