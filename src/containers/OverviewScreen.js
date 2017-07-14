import React from 'react';
import { ServerPanel } from '../components';

const OverviewScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
      <h2 className="screen__heading-subtitle">Overview</h2>
    </div>
    <div className="screen__main">
      Various stats and info go here.
      <ServerPanel />
    </div>
  </div>
);

export default OverviewScreen;
