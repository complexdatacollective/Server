import React, { useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import AdminApiClient from '../utils/adminApiClient';

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
      .catch((e) => {
        setState({ error: e.toString() });
      });
  }, []);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!state.uptime },
  );

  return (
    <div className={networkStatusClasses}>
      <button className="network-status__icon">
        <span className="network-status__badge" />
      </button>

      Network
    </div>
  );
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
