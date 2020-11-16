import { useRef, useState, useEffect } from 'react';
import AdminApiClient from '../utils/adminApiClient';

const initialState = {
  hostname: '',
  ip: null,
  deviceApiPort: null,
  mdnsStatus: null,
  publicAddresses: [],
  uptime: 0,
};

const useNetworkStatus = () => {
  const apiClient = useRef(new AdminApiClient());
  const [networkState, setNetworkState] = useState(initialState);

  useEffect(() => {
    apiClient.current.get('/health')
      .then((resp) => {
        const ip = resp.serverStatus.ip && resp.serverStatus.ip.address;

        setNetworkState({
          ...resp.serverStatus,
          ip: ip && ip.address,
        });
      })
      .catch((e) => {
        console.log('usernetwork status caught', e);
        setNetworkState({ error: e.toString(), ...initialState });
      });
  }, []);

  return networkState;
};

export default useNetworkStatus;
