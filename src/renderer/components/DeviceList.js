import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import Instructions from './Instructions';
import DeviceDetails from './DeviceDetails';

import { Button } from '../ui/components';

const EmptyDeviceList = () => (
  <div>
    <h2>No devices found.</h2>
    <Instructions showImportInstructions={false} />
  </div>
);

const DeviceList = ({ deleteDevice, devices, openDialog }) => {
  const confirmDelete = (deviceId) => {
    if (deleteDevice) { // eslint-disable-line no-alert
      openDialog({
        type: 'Confirm',
        title: 'Remove this device?',
        confirmLabel: 'Remove Device',
        onConfirm: () => deleteDevice(deviceId),
        message: 'Are you sure you want to remove this device? You will need to pair with it again in order to import protocols, or upload data.',
      });
    }
  };

  if (!devices || !devices.length) {
    return <EmptyDeviceList />;
  }

  console.log(devices);
  return devices.map(device => (
    <div className="device-list__device" key={device.id}>
      <div className="device-icon" />
      <DeviceDetails device={device} />
      {
        deleteDevice &&
        <Button color="neon-coral" onClick={() => confirmDelete(device.id)}>
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
  openDialog: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
  };
}

export default connect(null, mapDispatchToProps)(DeviceList);
