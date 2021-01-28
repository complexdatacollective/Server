import { useRef, useReducer, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { isEmpty } from 'lodash';
import resolverClient from '../utils/resolverClient';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

const initialState = {
  protocol: null,
  exportSettings: {},
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
    case 'START_RESOLVE':
      return {
        ...state,
        protocol: action.payload.protocol,
        exportSettings: action.payload.exportSettings,
        showResolver: true,
        isLoadingMatches: true,
        matches: [],
      };
    case 'RESET':
      return (
        action.payload.hard ?
          { ...initialState } :
          {
            ...state,
            protocol: null,
            exportSettings: {},
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

  const startResolve = settings =>
    resolverDispatch({ type: 'START_RESOLVE', payload: settings });

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

  const handleResolve = (client) => {
    // clean up old resolver
    setResolver(client.resolver);

    updateState({
      requestId: client.requestId,
    });
  };

  const cancelResolver = () => {
    resetState();
    cleanupResolver();
  };

  // cleanup on unmount
  useEffect(() => () => cleanupResolver(), []);

  const resolveProtocol = (protocol, options) => {
    const {
      id: protocolId,
    } = protocol;

    startResolve({ options, protocol });

    if (isEmpty(options.egoCastType)) {
      const e = new Error('Please specify an ego cast type');
      handleError(e);
      return Promise.reject(e);
    }

    if (isEmpty(options.resolverPath)) {
      const e = new Error('Please specify a resolver path');
      handleError(e);
      return Promise.reject(e);
    }

    if (isEmpty(options.interpreterPath)) {
      const e = new Error('Please specify a interpreter path');
      handleError(e);
      return Promise.reject(e);
    }

    return resolverClient(protocolId, options)
      .then(handleResolve)
      .catch(handleError);
  };

  return [
    resolverState,
    resolveProtocol,
    cancelResolver,
  ];
};

export default useResolver;
