import { useState, useRef } from 'react';
import uuid from 'uuid';
import resolverClient from '%utils/resolverClient';

const initialState = {
  resolveRequestId: null,
  matches: [],
  showResolver: false,
  isLoadingMatches: false,
  errorLoadingMatches: null,
};

const useResolver = ({ showError }) => {
  const resolverStream = useRef();
  const [state, setState] = useState(initialState);

  const cleanupResolverStream = () => {
    if (resolverStream.current) {
      resolverStream.current.abort();
      resolverStream.current = null;
    }
  };

  const reset = () => {
    setState({
      matches: [],
      isLoadingMatches: false,
      showResolver: false,
      errorLoadingMatches: null,
    });

    cleanupResolverStream();
  };

  const resolveProtocol = (protocol, exportSettings) => {
    if (!resolverClient) { return Promise.reject(); }

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
      entityResolutionOptions,
    } = exportSettings;

    const csvTypesNoEgo = new Set(exportSettings.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    setState(({
      ...state,
      showResolver: true,
      resolveRequestId: requestId,
      matches: [],
      isLoadingMatches: true,
      errorLoadingMatches: null,
    }));

    return resolverClient.resolveProtocol(
      protocolId,
      {
        entityResolutionOptions,
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        useDirectedEdges,
        useEgoData: useEgoData && showCsvOpts,
      },
    )
      .then(newResolverStream => new Promise((resolve, reject) => {
        resolverStream.current = newResolverStream;

        newResolverStream.on('data', (d) => {
          const data = JSON.parse(d.toString());
          setState({ ...state, matches: [...state.matches, data] });
        });

        newResolverStream.on('end', resolve);

        newResolverStream.on('error', reject);
      }))
      .then(() => {
        setState(({
          ...state,
          isLoadingMatches: false,
        }));
      })
      .catch((error) => {
        showError(error.message);

        setState(({
          ...state,
          isLoadingMatches: false,
          errorLoadingMatches: error,
          showResolver: false,
        }));
      })
      .finally(cleanupResolverStream);
  };

  return [state, resolveProtocol, reset];
};

export default useResolver;
