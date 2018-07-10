import React from 'react';

import Types from '../types';
import DeviceStatus from '../containers/DeviceStatus';
import Instructions from '../components/Instructions';

const GetStarted = ({ devices }) => (
  <div className="get-started">
    {
      devices.length > 0 &&
      <div className="get-started__device-status">
        <DeviceStatus dark />
      </div>
    }

    <h1 className="get-started__title">Get Started with Server</h1>
    <hr />

    <Instructions showPairingInstructions={devices.length === 0} />
  </div>
);

GetStarted.defaultProps = {
  devices: [],
};

GetStarted.propTypes = {
  devices: Types.devices,
};

export default GetStarted;
