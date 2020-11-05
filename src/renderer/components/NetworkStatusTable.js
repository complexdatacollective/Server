import React from 'react';
import PropTypes from 'prop-types';
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

const NetworkStatusTable = ({
  networkStatus,
  hostname,
  uptime,
  discoverable,
  port,
  addresses,
}) => {
  const uptimeBadge = networkStatus.uptime > 0
    ? <div className="network-status-badge network-status-badge--ok" />
    : <div className="network-status-badge network-status-badge--error" />;
  const uptimeDisplay = networkStatus.uptime && `${parseInt(networkStatus.uptime / 1000 / 60, 10)}m`;
  const mdnsBadge = <div className={`network-status-badge network-status-badge--${getMdnsStatus(networkStatus)}`} />;

  return (
    <div className="network-status-table">
      <table>
        { hostname &&
          <tr>
            <th>Computer name</th><td>{networkStatus.hostname}</td>
          </tr>
        }
        { uptime &&
          <tr>
            <th>Uptime</th><td>{uptimeBadge} {uptimeDisplay}</td>
          </tr>
        }
        { discoverable &&
          <tr>
            <th>Discoverable</th><td>{mdnsBadge} {getMdnsLabel(getMdnsStatus(networkStatus))}</td>
          </tr>
        }
        { port &&
          <tr>
            <th>Port</th>
            <td>
              <div><ClipboardText>{networkStatus.deviceApiPort}</ClipboardText></div>
            </td>
          </tr>
        }
        { addresses &&
          <tr>
            <th>Addresses</th>
            <td>
              {networkStatus.publicAddresses &&
                networkStatus.publicAddresses.map(ip =>
                  <div><ClipboardText>{ip}</ClipboardText></div>,
                )
              }
            </td>
          </tr>
        }
      </table>
    </div>
  );
};

NetworkStatusTable.defaultProps = {
  networkStatus: {},
  hostname: true,
  uptime: true,
  discoverable: true,
  port: true,
  addresses: true,
};

NetworkStatusTable.propTypes = {
  networkStatus: PropTypes.object,
  hostname: PropTypes.string,
  uptime: PropTypes.string,
  discoverable: PropTypes.string,
  port: PropTypes.string,
  addresses: PropTypes.string,
};

export default NetworkStatusTable;
