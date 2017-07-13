import React from 'react';
import { NarrativePanel } from 'network-canvas-ui';

const ExportScreen = () => (
  <div className="export-screen">
    <div className="export-screen__heading">
      <h1 className="export-screen__heading-title">Network Canvas</h1>
      <h2 className="export-screen__heading-subtitle">Exporter</h2>
    </div>
    <div className="export-screen__options">
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
