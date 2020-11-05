import React, { useState } from 'react';
import cx from 'classnames';
import InfoWindow from '../components/InfoWindow';
import NetworkStatusTable from '../components/NetworkStatusTable';
import useNetworkStatus from '../hooks/useNetworkStatus';

const NetworkStatus = () => {
  const networkStatus = useNetworkStatus();
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!networkStatus.uptime },
  );

  return [
    <button
      className={networkStatusClasses}
      onClick={() => setShowNetworkModal(true)}
      key="button"
    >
      <div className="network-status__icon">
        <span className="network-status__badge" />
      </div>

      Network
    </button>,
    <InfoWindow
      show={showNetworkModal}
      className="network-status__window"
      onClose={() => setShowNetworkModal(false)}
      key="window"
    >
      <h1>Network Status</h1>

      <NetworkStatusTable networkStatus={networkStatus} />
    </InfoWindow>,
  ];
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
