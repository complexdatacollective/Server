import React from 'react';

import Types from '../types';
import SessionList from '../containers/SessionList';
import { DummyDashboardFragment, PanelItem, ServerPanel } from '.';

const Workspace = ({ protocol }) => (
  <div className="workspace">
    <div className="dashboard">
      <ServerPanel className="dashboard__panel dashboard__panel--server-stats" />
      <div className="dashboard__panel">
        <h4>{protocol.name}</h4>
        <PanelItem label="Filename" value={protocol.filename} />
        <PanelItem label="Version" value={protocol.version} />
        <PanelItem label="Network Canvas Version" value={protocol.networkCanvasVersion} />
        <PanelItem label="Updated" value={protocol.updatedAt && protocol.updatedAt.toLocaleString()} />
      </div>
      <div className="dashboard__panel">
        <SessionList protocolId={protocol.id} />
      </div>
      <DummyDashboardFragment key={protocol.id} />
    </div>
  </div>
);

Workspace.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default Workspace;
