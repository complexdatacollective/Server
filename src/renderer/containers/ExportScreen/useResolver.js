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

const useResolver = () => {
  const resolverStream = useRef(null);
  const client = useRef(resolverClient);
  const [state, setState] = useState(initialState);
  const [matches, setMatches] = useState([]);

  const appendMatch = match => setMatches([...matches, match]);

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

  const handleData = (d) => {
    const data = JSON.parse(d.toString());
    // // matches.push(data);
    // appendMatch(data);
    // console.log(matches);
    setState({ ...state, matches: [...state.matches, data] });
    console.log(matches);
  };

  const resolveProtocol = (protocol, exportSettings) => {
    if (!client) { return Promise.reject(); }

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
      createNewResolution,
      minimumThreshold,
      entityResolutionPath,
    } = exportSettings;

    const csvTypesNoEgo = new Set(exportSettings.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    const newState = {
      ...state,
      showResolver: true,
      resolveRequestId: requestId,
      matches: [],
      isLoadingMatches: true,
      errorLoadingMatches: null,
    };

    console.log(state, newState);

    setState(newState);


    return client.current.resolveProtocol(
      protocolId,
      {
        resolutionId,
        createNewResolution,
        minimumThreshold,
        entityResolutionPath,
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        useDirectedEdges,
        useEgoData: useEgoData && showCsvOpts,
      },
    )
      .then(newResolverStream => new Promise((resolve, reject) => {
        resolverStream.current = newResolverStream;

        // const matches = [];

        newResolverStream.on('data', handleData);

        newResolverStream.on('end', resolve);

        newResolverStream.on('error', reject);
      }));
  //     .then(() => {
  //       console.log('DONE', state);

  //       setState(({
  //         ...state,
  //         isLoadingMatches: false,
  //       }));
  //     })
  //     .catch((error) => {
  //       showError(error.message);

  //       setState(({
  //         ...state,
  //         isLoadingMatches: false,
  //         errorLoadingMatches: error,
  //         // showResolver: false,
  //       }));
  //     })
  //     .finally(cleanupResolverStream);
  };

  return [state, resolveProtocol, reset];
};

export default useResolver;
