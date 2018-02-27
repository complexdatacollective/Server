import React from 'react';
import { NarrativePanel } from 'network-canvas-ui';

const ExportScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
      <h2 className="screen__heading-subtitle">Exporter</h2>
    </div>
    <div className="screen__main">
      <NarrativePanel title="Presets">
        Some options go here...
      </NarrativePanel>
      <NarrativePanel title="Advanced options">
        Some options go here...
      </NarrativePanel>
      <button>Export</button>
    </div>
  </div>
);

export default ExportScreen;
