import React from 'react';
import { Button } from 'network-canvas-ui';
import { FormWizard } from '../components';
import { ProtocolSelectScreen, ServerIPScreen } from '.';

const prevButton = prevPage => (
  <Button
    key="prev"
    content="Back"
    size="small"
    color="neon-coral"
    onClick={prevPage}
  />
);

const nextButton = nextPage => (
  <Button
    key="next"
    content="Continue"
    size="small"
    color="mustard"
    onClick={nextPage}
  />
);

const ServerSetupScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
    </div>
    <div className="screen__main">
      <FormWizard
        prevButton={prevButton}
        nextButton={nextButton}
      >
        <ProtocolSelectScreen />
        <ServerIPScreen />
      </FormWizard>
    </div>
  </div>
);

export default ServerSetupScreen;
