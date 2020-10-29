import React, { useRef, useState, useEffect } from 'react';
import AdminApiClient from '../utils/adminApiClient';

const buttonClass = 'device-icon';

const getMdnsStatus = ({ isAdvertising, mdnsIsSupported }) => {
  if (!mdnsIsSupported) { return 'Unsupported'; }
  return isAdvertising ? 'Active' : 'Pending';
};

const initialState = {};

const NetworkStatus = () => {
  const apiClient = useRef(new AdminApiClient());
  const [state, setState] = useState(initialState);

  useEffect(() => {
    apiClient.current.get('/health')
      .then((resp) => {
        const ip = resp.serverStatus.ip && resp.serverStatus.ip.address;

        setState({
          hostname: resp.serverStatus.hostname,
          ip: ip && ip.address,
          deviceApiPort: resp.serverStatus.hostname,
          mdnsStatus: getMdnsStatus(resp.serverStatus),
          publicAddresses: resp.serverStatus.publicAddresses,
          uptime: resp.serverStatus.uptime,
        });
      })
      .catch(() => {
        setState({});
      });
  }, []);

  return (
    <button className={buttonClass}>
      <span className="status-icon__badge" />
    </button>
  );
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
