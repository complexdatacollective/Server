import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PanelItem } from '../../components';
import withApiClient from '../withApiClient';
import DeviceStatus from '../../containers/DeviceStatus';

class ServerPanel extends Component {
  constructor() {
    super();
    this.state = {
      version: '0.0.0',
    };
  }

  componentWillMount() {
    this.getServerHealth();
  }

  componentDidUpdate() {
    this.getServerHealth();
  }

  getServerHealth() {
    const { apiClient } = this.props;
    if (!apiClient || this.state.serverOverview) {
      return;
    }
    apiClient.get('/health')
      .then((resp) => {
        const {
          deviceApiPort,
          hostname,
          ip,
          isAdvertising,
          mdnsIsSupported,
          publicAddresses,
          uptime,
        } = resp.serverStatus;
        let mdnsStatus = isAdvertising ? 'Active' : 'Pending';
        if (!mdnsIsSupported) {
          mdnsStatus = 'Unsupported';
        }
        this.setState({
          serverOverview: {
            hostname,
            ip: ip && ip.address,
            deviceApiPort,
            mdnsStatus,
            publicAddresses,
            uptime,
          },
        });
      })
      .catch(() => {
        this.setState({
          serverOverview: {},
        });
      });
  }

  render() {
    const { serverOverview } = this.state;
    const { className } = this.props;
    const overview = { ...serverOverview };
    const uptimeDisplay = overview.uptime && `${parseInt(overview.uptime / 1000 / 60, 10)}m`;

    return (
      <div className={`server-panel ${className}`}>
        <div className="server-panel__wrapper">
          <PanelItem label="Server IP Address" value={overview.publicAddresses || 'Offline'} />
          <PanelItem label="Pairing Port" value={overview.deviceApiPort || '-'} />
          <PanelItem label="Uptime" value={uptimeDisplay || '-'} />
          <PanelItem label="Hostname" value={overview.hostname || '-'} />
          <PanelItem label="Service Advertising" value={overview.mdnsStatus || '-'} />
          <DeviceStatus />
        </div>
      </div>
    );
  }
}

ServerPanel.defaultProps = {
  apiClient: null,
  className: '',
};

ServerPanel.propTypes = {
  apiClient: PropTypes.object,
  className: PropTypes.string,
};

export default withApiClient(ServerPanel);

export {
  ServerPanel as UnwrappedServerPanel,
};
