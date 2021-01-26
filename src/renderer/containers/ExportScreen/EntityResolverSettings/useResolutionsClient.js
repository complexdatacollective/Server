import { useState, useCallback, useEffect } from 'react';
import { last, get } from 'lodash';

const useResolutions = (apiClient, protocolId, deps = []) => {
  const [resolutions, setResolutions] = useState([]);
  const [unresolved, setUnresolved] = useState(0);
  const [egoCastType, setEgoCastType] = useState(null);

  const getResolutions = useCallback(
    () =>
      apiClient
        .get(`/protocols/${protocolId}/resolutions`)
        .then(({
          resolutions: _resolutions,
          unresolved: _unresolved,
        }) => {
          setResolutions(_resolutions);
          setUnresolved(_unresolved);

          const lastResolution = last(_resolutions);
          const _egoCastType = get(lastResolution, ['parameters', 'egoCastType']); // eslint-disable-line no-underscore-dangle

          if (_egoCastType) {
            setEgoCastType(_egoCastType);
          }

          return {
            resolutions: _resolutions,
            unresolved: _unresolved,
            egoCastType: _egoCastType,
          };
        }),
    [protocolId],
  );

  const deleteResolution = useCallback(
    id =>
      apiClient
        .delete(`/protocols/${protocolId}/resolutions/${id}`)
        .then(({ ids }) => {
          getResolutions();
          return ids;
        }),
    [protocolId, getResolutions],
  );

  useEffect(() => {
    getResolutions();
  }, deps);

  return [
    { resolutions, unresolved, egoCastType },
    { deleteResolution, getResolutions },
  ];
};

export default useResolutions;
