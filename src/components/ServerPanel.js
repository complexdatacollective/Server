/* eslint-disable */

import React, { Component } from 'react';
import { PanelItem } from '../components';

const remote = require('electron').remote;

const getOverview = () => {
  if(!remote) {
    return {
      ip: 'x.x.x.x',
      clients: 0,
    };
  }
  return remote.getGlobal('server');
}

class ServerPanel extends Component {
  render() {
    const overview = getOverview();

    return (
      <div className="server-panel">
        <PanelItem label="IP" value={overview.ip} />
        <PanelItem label="Clients" value={overview.clients} />
      </div>
    );
  }
}

export default ServerPanel;
