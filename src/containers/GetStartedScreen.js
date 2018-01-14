import React from 'react';
import { Button } from 'network-canvas-ui';

const GetStartedScreen = () => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Welcome to Server</h1>
      <h2 className="screen__heading-subtitle">This app is designed to help you deploy and gather data using your Network Canvas interview protocol.</h2>
    </div>
    <div className="grid__container grid--x-center">
      <Button
        content="Get Started"
        size="small"
        color="mustard"
      />
    </div>
  </div>
);

export default GetStartedScreen;
