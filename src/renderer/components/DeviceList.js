import React from 'react';
import PropTypes from 'prop-types';

import DeviceDetails from '../components/DeviceDetails';

const EmptyDeviceList = () => (
  <div>No devices found. You can pair a new device from the Network Canvas app.</div>
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
