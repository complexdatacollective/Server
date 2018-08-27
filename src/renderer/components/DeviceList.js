import React from 'react';
import PropTypes from 'prop-types';

import Instructions from './Instructions';
import DeviceDetails from './DeviceDetails';

const EmptyDeviceList = () => (
  <div>
    <h2>No devices found.</h2>
    <Instructions showImportInstructions={false} />
  </div>
);

const DeviceList = ({ devices }) => {
  if (!devices || !devices.length) {
    return <EmptyDeviceList />;
  }
  return devices.map(device => (
    <DeviceDetails key={device.id} device={device} />
  ));
};

DeviceList.defaultProps = {
  devices: null,
};

DeviceList.propTypes = {
  devices: PropTypes.array,
};

export default DeviceList;
