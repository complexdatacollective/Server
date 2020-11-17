import React from 'react';
import Instructions from '../components/Instructions';
import serverLogo from '../images/Srv-Flat.svg';

const GetStarted = () => (
  <div className="get-started">
    <div className="get-started__header">
      <img src={serverLogo} alt="Network Canvas Server" />
      <h1 className="get-started__title">Getting Started with Server</h1>
    </div>
    <Instructions />
  </div>
);

export default GetStarted;
