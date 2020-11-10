import React from 'react';
import { ProtocolCard } from '@codaco/ui/lib/components/Cards';
import Types, { PropTypes } from '../../types';
import { LinkButton } from '../';

const ProtocolPanel = ({ protocol, workspaceId }) => (
  <div className="workspace-panel overview-panel">
    <ProtocolCard
      schemaVersion={protocol.schemaVersion}
      lastModified={protocol.lastModified}
      installationDate={protocol.createdAt}
      name={protocol.name}
      description={protocol.description}
    />
    <div className="workspace-panel__buttons">
      <LinkButton to={`/workspaces/${workspaceId}/settings`} color="mustard">Settings</LinkButton>&nbsp;
      <LinkButton to={`/workspaces/${workspaceId}/casemanagement`} color="slate-blue">Manage Interview Sessions</LinkButton>&nbsp;
      <LinkButton to={`/workspaces/${workspaceId}/export`} color="neon-coral">Export data</LinkButton>
    </div>
  </div>
);

ProtocolPanel.propTypes = {
  protocol: Types.protocol.isRequired,
  workspaceId: PropTypes.string.isRequired,
};

export default ProtocolPanel;
