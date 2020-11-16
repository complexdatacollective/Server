import React from 'react';
import { DateTime } from 'luxon';
import { ProtocolCard } from '@codaco/ui/lib/components/Cards';
import Types, { PropTypes } from '../../types';
import { LinkButton } from '../';

const ProtocolPanel = ({ protocol, workspaceId }) => (
  <div className="workspace-panel overview-panel">
    <h1 style={{ marginTop: 0 }}>Protocol</h1>
    <ProtocolCard
      schemaVersion={protocol.schemaVersion}
      lastModified={DateTime.fromJSDate(protocol.lastModified).toISO()}
      installationDate={DateTime.fromJSDate(protocol.createdAt).toISO()}
      name={protocol.name}
      description={protocol.description}
    />
  </div>
);

ProtocolPanel.propTypes = {
  protocol: Types.protocol.isRequired,
  workspaceId: PropTypes.string.isRequired,
};

export default ProtocolPanel;
