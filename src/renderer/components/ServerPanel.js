import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PanelItem } from '../components';
import withApiClient from './withApiClient';

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
        <PanelItem label="Local Server IP" value={overview.ip || 'Offline'} />
        <PanelItem label="Server Port" value={overview.deviceApiPort || '-'} />
        <PanelItem label="Uptime" value={uptimeDisplay || '-'} />
        <PanelItem label="Server Hostname" value={overview.hostname || '-'} />
        <PanelItem label="Service Advertising" value={overview.mdnsStatus || '-'} />
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
