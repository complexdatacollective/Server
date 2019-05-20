import React from 'react';
import Types, { PropTypes } from '../../types';
import PanelItem from './PanelItem';
import { LinkButton } from '../';

const ProtocolPanel = ({ protocol, workspaceId }) => (
  <div className="workspace-panel overview-panel">
    <h1>{protocol.name}</h1>
    <PanelItem label="Description" value={protocol.description} placeholder="None available" />
    <PanelItem label="Protocol Schema Version" value={protocol.schemaVersion} placeholder="None specified" />
    <PanelItem label="Last Modified" value={protocol.lastModified && protocol.lastModified.toLocaleString()} placeholder="Unknown" />
    <PanelItem label="Imported" value={protocol.updatedAt && protocol.updatedAt.toLocaleString()} />
    <div className="workspace-panel__buttons">
      <LinkButton to={`/workspaces/${workspaceId}/settings`} color="mustard">Settings</LinkButton>&nbsp;
      <LinkButton to={`/workspaces/${workspaceId}/export`} color="neon-coral">Export data</LinkButton>
    </div>
  </div>
);

ProtocolPanel.propTypes = {
  protocol: Types.protocol.isRequired,
  workspaceId: PropTypes.string.isRequired,
};

export default ProtocolPanel;
