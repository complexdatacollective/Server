/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
import React from 'react';
import PropTypes from 'prop-types';

import DeviceDetails from '../components/DeviceDetails';

const EmptyDeviceList = () => (
  <div>No devices found. You can pair a new device from the Network Canvas app.</div>
);

const DeviceList = ({ devices }) => {
  if (!devices) {
    return <EmptyDeviceList />;
  }
  return devices.map(device => (
    <DeviceDetails key={device._id} device={device} />
  ));
};

DeviceList.defaultProps = {
  devices: null,
};

DeviceList.propTypes = {
  devices: PropTypes.array,
};

export default DeviceList;
