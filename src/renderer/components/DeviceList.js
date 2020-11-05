import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import DeviceCard from './DeviceCard';

const DeviceList = ({ deleteDevice, devices, openDialog, showInstructions }) => {
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

  const renderedDevices = devices.map((device, index) => (
    <DeviceCard key={index} {...device} onClickHandler={() => confirmDelete(device.id)} />
  ));

  return (
    <div className="device-list">
      {renderedDevices}

      { devices.length === 0 &&
        <h2>No devices found.</h2>
        <p><a onClick={showInstructions}>Click here to view pairing instructions.</a></p>
      }
    </div>
  );
};

DeviceList.defaultProps = {
  deleteDevice: null,
  devices: [],
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
