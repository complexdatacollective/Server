import React from 'react';
import PropTypes from 'prop-types';

import Instructions from './Instructions';
import DeviceDetails from './DeviceDetails';

import { Button } from '../ui/components';

const EmptyDeviceList = () => (
  <div>
    <h2>No devices found.</h2>
    <Instructions showImportInstructions={false} />
  </div>
);

const DeviceList = ({ deleteDevice, devices }) => {
  const confirmDelete = (deviceId) => {
    if (deleteDevice && confirm('Remove this device?')) { // eslint-disable-line no-alert
      deleteDevice(deviceId);
    }
  };

  if (!devices || !devices.length) {
    return <EmptyDeviceList />;
  }

  return devices.map(device => (
    <div className="device-list__device" key={device.id}>
      <DeviceDetails device={device} />
      {
        deleteDevice &&
        <Button size="small" color="neon-coral" onClick={() => confirmDelete(device.id)}>
          Unpair
        </Button>
      }
    </div>
  ));
};

DeviceList.defaultProps = {
  deleteDevice: null,
  devices: null,
};

DeviceList.propTypes = {
  deleteDevice: PropTypes.func,
  devices: PropTypes.array,
};

export default DeviceList;
