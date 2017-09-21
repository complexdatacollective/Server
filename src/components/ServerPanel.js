import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { PanelItem } from '../components';
import Updater from '../utils/Updater';

const updater = new Updater();

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

    updater.on('UPDATE_AVAILABLE', ({ version, notes }) => {
      this.setState({
        ...defaultServerOverview,
        version,
        notes,
      });
    });
  }

  render() {
    const { serverOverview } = this.props;

    const overview = { ...defaultServerOverview, ...serverOverview };
    return (
      <div className="server-panel">
        <PanelItem label="IP" value={JSON.stringify(overview.ip)} />
        <PanelItem label="Clients" value={overview.clients} />
        <PanelItem label="Uptime" value={overview.uptime} />
        <PanelItem label="Public Key" value={overview.publicKey} />
      </div>
    );
  }
}

ServerPanel.propTypes = {
  serverOverview: PropTypes.object,
};

ServerPanel.defaultProps = {
  serverOverview: defaultServerOverview,
};

export default ServerPanel;
