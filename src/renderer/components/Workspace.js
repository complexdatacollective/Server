import React from 'react';

import Types from '../types';
import { PanelItem } from '.';

const Workspace = ({ protocol }) => (
  <div className="workspace">
    {/* <TabBar /> */}
    {/*
      <ServerPanel className="overview-dashboard__panel overview-dashboard__panel--server-stats" />
    */}
    <div className="overview-dashboard__panel">
      <h4>{protocol.name}</h4>
      <PanelItem label="Filename" value={protocol.filename} />
      <PanelItem label="Version" value={protocol.version} />
      <PanelItem label="Network Canvas Version" value={protocol.networkCanvasVersion} />
      <PanelItem label="Updated" value={protocol.updatedAt && protocol.updatedAt.toLocaleString()} />
    </div>
  </div>
);

Workspace.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default Workspace;
