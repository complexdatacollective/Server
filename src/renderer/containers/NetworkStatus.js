import React, { useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import AdminApiClient from '../utils/adminApiClient';
import InfoWindow from '../components/InfoWindow';
import ClipboardText from '../components/ClipboardText';

const getMdnsLabel = mdnsStatus => ({
  error: 'Unsupported',
  ok: 'Active',
  pending: 'Pending',
}[mdnsStatus]);

const getMdnsStatus = ({ isAdvertising, mdnsIsSupported }) => {
  if (!mdnsIsSupported) { return 'error'; }
  return isAdvertising ? 'ok' : 'pending';
};

const initialState = {
  hostname: '',
  ip: null,
  deviceApiPort: null,
  mdnsStatus: null,
  publicAddresses: [],
  uptime: 0,
};

const NetworkStatus = () => {
  const apiClient = useRef(new AdminApiClient());
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkState, setNetworkState] = useState(initialState);

  useEffect(() => {
    apiClient.current.get('/health')
      .then((resp) => {
        const ip = resp.serverStatus.ip && resp.serverStatus.ip.address;

        setNetworkState({
          ...resp.serverStatus,
          // hostname: resp.serverStatus.hostname,
          ip: ip && ip.address,
          // deviceApiPort: resp.serverStatus.deviceApiPort,
          // mdnsStatus: getMdnsStatus(resp.serverStatus),
          // publicAddresses: resp.serverStatus.publicAddresses,
          // uptime: resp.serverStatus.uptime,
        });
      })
      .catch((e) => {
        setNetworkState({ error: e.toString(), ...initialState });
      });
  }, []);

  const networkStatusClasses = cx(
    'network-status',
    { 'network-status--is-active': !!networkState.uptime },
  );

  const uptimeBadge = networkState.uptime > 0
    ? <div className="network-status-badge network-status-badge--ok" />
    : <div className="network-status-badge network-status-badge--error" />;
  const uptimeDisplay = networkState.uptime && `${parseInt(networkState.uptime / 1000 / 60, 10)}m`;
  const mdnsBadge = <div className={`network-status-badge network-status-badge--${getMdnsStatus(networkState)}`} />;

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
          <th>Computer name</th><td>{networkState.hostname}</td>
        </tr>
        <tr>
          <th>Uptime</th><td>{uptimeBadge} {uptimeDisplay}</td>
        </tr>
        <tr>
          <th>Discoverable</th><td>{mdnsBadge} {getMdnsLabel(getMdnsStatus(networkState))}</td>
        </tr>
        <tr>
          <th>Port</th>
          <td>
            <div><ClipboardText>{networkState.deviceApiPort}</ClipboardText></div>
          </td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            {networkState.publicAddresses &&
              networkState.publicAddresses.map(ip =>
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
