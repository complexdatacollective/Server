import React from 'react';

import Types from '../types';
import SessionPanel from '../containers/SessionPanel';
import { DummyDashboardFragment, PanelItem, ServerPanel } from '.';

const Workspace = ({ protocol }) => (
  <div className="workspace">
    <div className="dashboard">
      <ServerPanel className="dashboard__panel dashboard__panel--server-stats" />
      <div className="dashboard__panel">
        <h4>{protocol.name}</h4>
        <PanelItem label="Description" value={protocol.description} placeholder="None available" />
        <PanelItem label="Network Canvas Version" value={protocol.networkCanvasVersion} />
        <PanelItem label="Last Modified" value={protocol.lastModified && protocol.lastModified.toLocaleString()} placeholder="Unknown" />
        <PanelItem label="Imported" value={protocol.updatedAt && protocol.updatedAt.toLocaleString()} />
      </div>
      <SessionPanel protocolId={protocol.id} />
      <DummyDashboardFragment key={protocol.id} />
    </div>
  </div>
);

Workspace.defaultProps = {
  devices: null,
};

Workspace.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default Workspace;
