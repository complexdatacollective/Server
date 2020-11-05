import React, { useState } from 'react';
import cx from 'classnames';
import InfoWindow from '../components/InfoWindow';
import ClipboardText from '../components/ClipboardText';
import useNetworkStatus from '../hooks/useNetworkStatus';

const getMdnsLabel = mdnsStatus => ({
  error: 'Unsupported',
  ok: 'Active',
  pending: 'Pending',
}[mdnsStatus]);

const getMdnsStatus = ({ isAdvertising, mdnsIsSupported }) => {
  if (!mdnsIsSupported) { return 'error'; }
  return isAdvertising ? 'ok' : 'pending';
};

const NetworkStatus = () => {
  const networkStatus = useNetworkStatus();
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!networkStatus.uptime },
  );

  const uptimeBadge = networkStatus.uptime > 0
    ? <div className="network-status-badge network-status-badge--ok" />
    : <div className="network-status-badge network-status-badge--error" />;
  const uptimeDisplay = networkStatus.uptime && `${parseInt(networkStatus.uptime / 1000 / 60, 10)}m`;
  const mdnsBadge = <div className={`network-status-badge network-status-badge--${getMdnsStatus(networkStatus)}`} />;

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

      <table>
        <tr>
          <th>Computer name</th><td>{networkStatus.hostname}</td>
        </tr>
        <tr>
          <th>Uptime</th><td>{uptimeBadge} {uptimeDisplay}</td>
        </tr>
        <tr>
          <th>Discoverable</th><td>{mdnsBadge} {getMdnsLabel(getMdnsStatus(networkStatus))}</td>
        </tr>
        <tr>
          <th>Port</th>
          <td>
            <div><ClipboardText>{networkStatus.deviceApiPort}</ClipboardText></div>
          </td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            {networkStatus.publicAddresses &&
              networkStatus.publicAddresses.map(ip =>
                <div><ClipboardText>{ip}</ClipboardText></div>,
              )
            }
          </td>
        </tr>
      </table>
    </InfoWindow>,
  ];
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
