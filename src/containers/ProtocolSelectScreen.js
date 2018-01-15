import React from 'react';
import { Button } from 'network-canvas-ui';

const ProtocolSelectScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Where is your protocol file?</h1>
      <h2 className="screen__heading-subtitle">Click the browser button below, and navigate to where the protocol you want to use is stored on your computer.</h2>
    </div>
    <div className="grid__container grid--x-center">
      <Button
        content="Browse"
        size="small"
      />
    </div>
  </div>
);

export default ProtocolSelectScreen;
