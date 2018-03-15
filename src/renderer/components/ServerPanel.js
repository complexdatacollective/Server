import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PanelItem } from '../components';
import AdminApiClient from '../utils/adminApiClient';

const server = new AdminApiClient();

const defaultServerOverview = {
  ip: 'x.x.x.x',
  clients: 0,
  uptime: 0,
  publicKey: '',
};
class ServerPanel extends Component {
  constructor() {
    super();

    this.state = {
      version: '0.0.0',
      notes: '',
    };

    server.on('SERVER_STATUS', (data) => {
      this.setState({ serverOverview: data });
    });
  }

  componentWillMount() {
    server.requestServerStatus();
  }

  render() {
    const { serverOverview } = this.state;
    const { className } = this.props;

    const overview = { ...defaultServerOverview, ...serverOverview };
    return (
      <div className={`server-panel ${className}`}>
        <PanelItem label="Server Public IP" value={JSON.stringify(overview.ip)} />
        <PanelItem label="Uptime" value={overview.uptime} />
        <PanelItem label="Server Public Key" value={overview.publicKey} />
      </div>
    );
  }
}

ServerPanel.defaultProps = {
  className: '',
};

ServerPanel.propTypes = {
  className: PropTypes.string,
};

export default ServerPanel;
