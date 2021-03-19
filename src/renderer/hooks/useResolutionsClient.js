import {
  useState, useCallback, useEffect, useRef,
} from 'react';
import { last, get } from 'lodash';
import AdminApiClient from '../utils/adminApiClient';

const useResolutions = (protocolId, deps = []) => {
  const adminClient = useRef(new AdminApiClient());
  const [resolutions, setResolutions] = useState([]);
  const [unresolved, setUnresolved] = useState(0);
  const [egoCastType, setEgoCastType] = useState(null);

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

          setEgoCastType(_egoCastType);

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
    { deleteResolution, getResolutions, saveResolution },
  ];
};

export default useResolutions;
