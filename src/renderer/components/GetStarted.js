import React from 'react';

import Types from '../types';
import DeviceStatus from '../containers/DeviceStatus';
import Instructions from '../components/Instructions';
import serverLogo from '../images/Srv-Flat.svg';

const GetStarted = ({ apiInfo, devices }) => (
  <div className="get-started">
    {
      devices.length > 0 &&
      <div className="get-started__device-status">
        <DeviceStatus dark />
      </div>
    }
    <img src={serverLogo} alt="Network Canvas Server" />
    <h1 className="get-started__title">Get Started with Server</h1>
    <Instructions apiInfo={apiInfo} showPairingInstructions={devices.length === 0} />
  </div>
);

GetStarted.defaultProps = {
  apiInfo: null,
  devices: [],
};

GetStarted.propTypes = {
  apiInfo: Types.deviceApiInfo,
  devices: Types.devices,
};

export default GetStarted;
