import { useRef, useReducer, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { isEmpty, throttle } from 'lodash';
import resolverClient from '../utils/resolverClient';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

const initialState = {
  protocol: null,
  options: {},
  requestId: null,
  matches: [],
  isActive: false,
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
    case 'ADD_MATCHES':
      return {
        ...state,
        matches: [...state.matches, ...action.payload],
      };
    case 'START_RESOLVE':
      return {
        ...state,
        protocol: action.payload.protocol,
        options: action.payload.options,
        isActive: true,
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
            options: {},
            isLoadingMatches: false,
            isActive: false,
            errorLoadingMatches: null,
            matches: [],
          }
      );
    default:
      throw new Error();
  }
};

const useBuffer = () => {
  const queue = useRef([]);

  const add = (data) => {
    queue.current.push(data);
  };

  const drain = () =>
    queue.current.splice(0, queue.current.length);

  return [add, drain];
};

const useResolver = () => {
  const dispatch = useDispatch();
  const resolver = useRef(null);
  const [addMatch, drainMatches] = useBuffer();
  const [resolverState, resolverDispatch] = useReducer(resolverReducer, initialState);

  const updateMatches = throttle(() => {
    const matches = drainMatches();
    resolverDispatch({ type: 'ADD_MATCHES', payload: matches });
  }, 33); // Approx 30fps

  const handleMatch = (data) => {
    addMatch(data);
    updateMatches();
  };

  const updateState = props =>
    resolverDispatch({ type: 'UPDATE', payload: props });

  const resetState = (hard = false) =>
    resolverDispatch({ type: 'RESET', payload: { hard } });

  const startResolve = (settings) => {
    drainMatches();
    resolverDispatch({ type: 'START_RESOLVE', payload: settings });
  };

  const abortResolver = () => {
    if (!resolver.current) { return; }
    resolver.current.abort();
  };

  const cleanupResolver = () => {
    if (!resolver.current) { return; }
    abortResolver(); // may not be necessary if we quit, but otherwise
    resolver.current.removeAllListeners('match');
    resolver.current.removeAllListeners('end');
    resolver.current.removeAllListeners('error');
    resolver.current = null;
  };

  const handleEnd = () => {
    cleanupResolver();
    updateState({ isLoadingMatches: false });
  };

  const handleError = (error) => {
    dispatch(dialogActions.openDialog({
      type: 'Error',
      error,
    }));

    updateState({
      errorLoadingMatches: error,
      matches: [],
      isActive: false,
    });
  };

  const setResolver = (nextResolver) => {
    cleanupResolver();

    if (!nextResolver) { return; }

    resolver.current = nextResolver;

    resolver.current.on('match', handleMatch);
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
