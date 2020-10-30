import React, { useRef, useState, useEffect } from 'react';
import cx from 'classnames';
import AdminApiClient from '../utils/adminApiClient';
import InfoWindow from '../components/InfoWindow';
import ClipboardText from '../components/ClipboardText';

const getMdnsStatus = ({ isAdvertising, mdnsIsSupported }) => {
  if (!mdnsIsSupported) { return 'Unsupported'; }
  return isAdvertising ? 'Active' : 'Pending';
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
          hostname: resp.serverStatus.hostname,
          ip: ip && ip.address,
          deviceApiPort: resp.serverStatus.deviceApiPort,
          mdnsStatus: getMdnsStatus(resp.serverStatus),
          publicAddresses: resp.serverStatus.publicAddresses,
          uptime: resp.serverStatus.uptime,
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


  const uptimeDisplay = networkState.uptime && `${parseInt(networkState.uptime / 1000 / 60, 10)}m`;

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
    <InfoWindow
      show={showNetworkModal}
      className="network-status__window"
      onClose={() => setShowNetworkModal(false)}
    >
      <h2>Network Status</h2>

      <table>
        <tr>
          <th>Computer name</th><td>{networkState.hostname}</td>
        </tr>
        <tr>
          <th>Discoverable</th><td>{networkState.mdnsStatus}</td>
        </tr>
        <tr>
          <th>Uptime</th><td>{uptimeDisplay}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            {networkState.publicAddresses &&
              networkState.publicAddresses.map((ip) => {
                const ipText = /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(ip)
                  ? `http://${ip}:${networkState.deviceApiPort}`
                  : `http://[${ip}]:${networkState.deviceApiPort}`;
                return <div><ClipboardText>{ipText}</ClipboardText></div>;
              })
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
