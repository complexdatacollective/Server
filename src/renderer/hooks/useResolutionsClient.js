import { useState, useCallback, useEffect, useRef } from 'react';
import { last, get } from 'lodash';
import AdminApiClient from '../utils/adminApiClient';

const defaultExportOptions = {
  exportGraphML: true,
  exportCSV: {
    adjacencyMatrix: false,
    attributeList: true,
    edgeList: true,
    egoAttributeList: true,
  },
  globalOptions: {
    unifyNetworks: false,
    useDirectedEdges: false,
    useScreenLayoutCoordinates: true,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

const useResolutions = (protocolId, deps = []) => {
  const adminClient = useRef(new AdminApiClient());
  const [resolutions, setResolutions] = useState([]);
  const [unresolved, setUnresolved] = useState(0);
  const [egoCastType, setEgoCastType] = useState(null);

  const exportResolution = useCallback(
    (id) => {
      if (!protocolId) { return Promise.resolve(null); }

      const options = {
        ...defaultExportOptions,
        resolutionId: id,
      };

      return adminClient.current
        .post(`/protocols/${protocolId}/export_requests`, options);
    },
    [protocolId],
  );

  const getResolutions = useCallback(
    () => {
      if (!protocolId) { return Promise.resolve(null); }
      return adminClient.current
        .get(`/protocols/${protocolId}/resolutions`)
        .then(({
          resolutions: _resolutions,
          unresolved: _unresolved,
        }) => {
          setResolutions(_resolutions);
          setUnresolved(_unresolved);

          const lastResolution = last(_resolutions);
          const _egoCastType = get(lastResolution, ['options', 'egoCastType']); // eslint-disable-line no-underscore-dangle

          if (_egoCastType) {
            setEgoCastType(_egoCastType);
          }

          return {
            resolutions: _resolutions,
            unresolved: _unresolved,
            egoCastType: _egoCastType,
          };
        });
    },
    [protocolId],
  );

  const deleteResolution = useCallback(
    (id) => {
      if (!protocolId) { return Promise.resolve(null); }
      return adminClient.current
        .delete(`/protocols/${protocolId}/resolutions/${id}`)
        .then(({ ids }) => {
          getResolutions();
          return ids;
        });
    },
    [protocolId, getResolutions],
  );

  const saveResolution = useCallback(
    (options, transforms) => {
      if (!protocolId) { return Promise.resolve(null); }
      return adminClient.current
        .post(`/protocols/${protocolId}/resolutions`, { resolution: { options, transforms } })
        .finally(getResolutions);
    },
    [protocolId],
  );

  useEffect(() => {
    getResolutions();
  }, [protocolId, ...deps]);

  return [
    { resolutions, unresolved, egoCastType },
    { deleteResolution, getResolutions, saveResolution, exportResolution },
  ];
};

export default useResolutions;
