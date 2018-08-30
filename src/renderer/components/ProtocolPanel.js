import React from 'react';

import Types from '../types';
import PanelItem from './PanelItem';

const ProtocolPanel = ({ protocol }) => (
  <div className="dashboard__panel">
    <h4>{protocol.name}</h4>
    <PanelItem label="Description" value={protocol.description} placeholder="None available" />
    <PanelItem label="Network Canvas Version" value={protocol.networkCanvasVersion} />
    <PanelItem label="Last Modified" value={protocol.lastModified && protocol.lastModified.toLocaleString()} placeholder="Unknown" />
    <PanelItem label="Imported" value={protocol.updatedAt && protocol.updatedAt.toLocaleString()} />
  </div>
);

ProtocolPanel.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default ProtocolPanel;
