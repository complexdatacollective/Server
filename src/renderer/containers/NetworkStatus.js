import React, { useState } from 'react';
import cx from 'classnames';
import Overlay from '../components/Overlay';
import NetworkStatusTable from '../components/NetworkStatusTable';
import useNetworkStatus from '../hooks/useNetworkStatus';

const getNetworkIndicatorStatus = (networkStatus) => {
  if (networkStatus.uptime === 0) { return 'error'; }
  if (networkStatus.mdnsIsSupported && networkStatus.isAdvertising) { return 'ok'; }
  return 'pending';
};

const NetworkStatus = (props) => {
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const networkStatus = useNetworkStatus([showNetworkModal, props.networkStatusError]);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!networkStatus.uptime },
  );

  const networkIndicatorStatus = getNetworkIndicatorStatus(networkStatus);

  const tooltip = () => {
    if (networkIndicatorStatus === 'ok') {
      return 'Server advertising: available<br /><br />View network status';
    }

    if (networkIndicatorStatus === 'error') {
      return 'Server advertising: error<br /><br />View network status';
    }

    if (networkIndicatorStatus === 'pending') {
      return 'Server advertising: unavailable<br /><br />View network status';
    }

    return 'View network status';
  };

  return [
    <div
      data-tip={tooltip()}
      data-for="app-tooltip"
      className={networkStatusClasses}
      onClick={() => setShowNetworkModal(true)}
      key="button"
      role="button"
      tabIndex={0}
    >
      <div className="network-status__icon">
        <span className={`network-status__badge network-status-badge--${networkIndicatorStatus}`} />
      </div>
    </div>,
    <Overlay
      show={showNetworkModal}
      title="Network Status"
      onClose={() => setShowNetworkModal(false)}
      className="network-status__overlay"
      key="window"
    >
      <NetworkStatusTable networkStatus={networkStatus} />
    </Overlay>,
  ];
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
