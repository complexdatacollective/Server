/* eslint-disable */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PanelItem } from '../components';

const remote = require('electron').remote;

const defaultServerOverview = {
  ip: 'x.x.x.x',
  clients: 0,
  uptime: 0,
  publicKey: '',
};

const getServerOverview = () =>
  remote ? Object.assign({}, defaultServerOverview, remote.getGlobal('serverOverview')) : defaultServerOverview;

class ServerPanel extends Component {
  render() {
    const {
      overview,
    } = this.props;
    return (
      <div className="server-panel">
        <PanelItem label="IP" value={overview.ip} />
        <PanelItem label="Clients" value={overview.clients} />
        <PanelItem label="Uptime" value={overview.uptime} />
        <PanelItem label="Public Key" value={overview.publicKey} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    overview: getServerOverview(),
  }
}

export default connect(mapStateToProps)(ServerPanel);
