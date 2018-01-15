import React from 'react';
import { FormWizard } from '../components';
import { GetStartedScreen, ProtocolSelectScreen } from '.';

const ServerSetupScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
    </div>
    <div className="screen__main">
      <FormWizard>
        <GetStartedScreen />
        <ProtocolSelectScreen />
      </FormWizard>
    </div>
  </div>
);

export default ServerSetupScreen;
