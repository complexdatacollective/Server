import { useState, useCallback, useEffect, useRef } from 'react';
import { last, get } from 'lodash';
import AdminApiClient from '../utils/adminApiClient';

const useResolutions = (protocolId, deps = []) => {
  const adminClient = useRef(new AdminApiClient());
  const [resolutions, setResolutions] = useState([]);
  const [unresolved, setUnresolved] = useState(0);
  const [egoCastType, setEgoCastType] = useState(null);

  const getResolutions = useCallback(
    () =>
      adminClient.current
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
      adminClient.current
        .delete(`/protocols/${protocolId}/resolutions/${id}`)
        .then(({ ids }) => {
          getResolutions();
          return ids;
        }),
    [protocolId, getResolutions],
  );

  const saveResolution = useCallback(
    (parameters, resolution) =>
      adminClient.current
        .post(`/protocols/${protocolId}/resolutions`, { parameters, resolution }),
    [protocolId],
  );

  useEffect(() => {
    getResolutions();
  }, deps);

  return [
    { resolutions, unresolved, egoCastType },
    { deleteResolution, getResolutions, saveResolution },
  ];
};

export default useResolutions;
