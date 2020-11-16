import React from 'react';
import { DateTime } from 'luxon';
import { ProtocolCard } from '@codaco/ui/lib/components/Cards';
import Types from '../../types';

const ProtocolCardPanel = ({ protocol }) => (
  <div className="dashboard__panel">
    <h4>Protocol Card</h4>
    <ProtocolCard
      schemaVersion={protocol.schemaVersion}
      lastModified={DateTime.fromJSDate(protocol.lastModified).toISO()}
      installationDate={DateTime.fromJSDate(protocol.createdAt).toISO()}
      name={protocol.name}
      description={protocol.description}
    />
  </div>
);

ProtocolCardPanel.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default ProtocolCardPanel;
