import React from 'react';
import { NarrativePanel } from '../ui/components';

const ExportScreen = () => (
  <div>
    <NarrativePanel title="Presets">
      Some options go here...
    </NarrativePanel>
    <NarrativePanel title="Advanced options">
      Some options go here...
    </NarrativePanel>
    <button>Export</button>
  </div>
);

export default ExportScreen;
