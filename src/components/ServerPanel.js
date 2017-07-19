import React from 'react';
import PropTypes from 'prop-types';
import { PanelItem } from '../components';
import ipc from '../containers/ipc';

const defaultServerOverview = {
  ip: 'x.x.x.x',
  clients: 0,
  uptime: 0,
  publicKey: '',
};

const ServerPanel = ({ serverOverview }) => {
  const overview = { ...defaultServerOverview, ...serverOverview };
  return (
    <div className="server-panel">
      <PanelItem label="IP" value={overview.ip} />
      <PanelItem label="Clients" value={overview.clients} />
      <PanelItem label="Uptime" value={overview.uptime} />
      <PanelItem label="Public Key" value={overview.publicKey} />
    </div>
  );
};

ServerPanel.propTypes = {
  serverOverview: PropTypes.any.isRequired,
};

export default ipc('serverOverview')(ServerPanel);
