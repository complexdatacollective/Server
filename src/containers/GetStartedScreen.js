import React from 'react';
import { Button } from 'network-canvas-ui';

const GetStartedScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
      <h2 className="screen__heading-subtitle">Overview</h2>
    </div>
    <div className="screen__main">
      <Button content="Get Started" />
    </div>
  </div>
);

export default GetStartedScreen;
