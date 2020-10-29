import React, { useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import { Modal } from '@codaco/ui';
import AdminApiClient from '../utils/adminApiClient';

const getMdnsStatus = ({ isAdvertising, mdnsIsSupported }) => {
  if (!mdnsIsSupported) { return 'Unsupported'; }
  return isAdvertising ? 'Active' : 'Pending';
};

const initialState = {};

const NetworkStatus = () => {
  const apiClient = useRef(new AdminApiClient());
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkState, setNetworkState] = useState(initialState);

  useEffect(() => {
    apiClient.current.get('/health')
      .then((resp) => {
        const ip = resp.serverStatus.ip && resp.serverStatus.ip.address;

        setNetworkState({
          hostname: resp.serverStatus.hostname,
          ip: ip && ip.address,
          deviceApiPort: resp.serverStatus.hostname,
          mdnsStatus: getMdnsStatus(resp.serverStatus),
          publicAddresses: resp.serverStatus.publicAddresses,
          uptime: resp.serverStatus.uptime,
        });
      })
      .catch((e) => {
        setNetworkState({ error: e.toString() });
      });
  }, []);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!networkState.uptime },
  );

  return [
    <button
      className={networkStatusClasses}
      onClick={() => setShowNetworkModal(true)}
    >
      <div className="network-status__icon">
        <span className="network-status__badge" />
      </div>

      Network
    </button>,
    <Modal show={showNetworkModal} onCancel={() => setShowNetworkModal(false)}>
      Network status modal

      {JSON.stringify({ networkState }, null, 2)};
    </Modal>,
  ];
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
