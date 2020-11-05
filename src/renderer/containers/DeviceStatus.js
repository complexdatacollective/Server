
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { bindActionCreators } from 'redux';
import { motion, AnimateSharedLayout } from 'framer-motion';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button } from '@codaco/ui';
import Types from '../types';
import { actionCreators } from '../ducks/modules/devices';

import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { selectors } from '../ducks/modules/pairingRequest';
import InfoWindow from '../components/InfoWindow';
import PairingInstructions from '../components/PairingInstructions';
import DeviceCard from '../components/DeviceCard';
import useNetworkStatus from '../hooks/useNetworkStatus';

const DeviceStatus = ({
  devices,
  hasPendingRequest,
  loadDevices,
  deleteDevice,
  openDialog,
}) => {
  const networkStatus = useNetworkStatus();
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!showDevicesModal) { setShowInstructions(false); }
  }, [showDevicesModal]);

  useEffect(() => {
    if (hasPendingRequest) {
      setShowDevicesModal(false);
      setShowInstructions(false);
    }
  }, [hasPendingRequest]);

  useEffect(() => {
    loadDevices();
  }, [hasPendingRequest]);

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

  const renderedDevices = devices && devices.length > 0
    ? devices.map((device, index) => (
      <DeviceCard key={index} {...device} onClickHandler={() => confirmDelete(device.id)} />
    ))
    : <h2>No devices found.</h2>;


  return [
    <button
      className="device-status"
      onClick={() => setShowDevicesModal(true)}
      key="button"
    >
      <div className="device-status__icon">
        <span className="device-status__badge">{devices ? devices.length : ''}</span>
      </div>

      {hasPendingRequest }

      Devices
    </button>,
    <InfoWindow
      show={showDevicesModal}
      className="device-status__window"
      onClose={() => setShowDevicesModal(false)}
      key="window"
    >
      <motion.div layout>
        <AnimateSharedLayout>
          { !showInstructions &&
            <motion.div layoutId="content" key="devices" layout>
              <h1>Paired Devices</h1>

              <p>Devices that have been paired with the server are listed below:</p>

              <div className="device-status__list" layout>
                {renderedDevices}
              </div>

              <p>
                <Button size="small" onClick={() => setShowInstructions(true)}>
                  View pairing instructions.
                </Button>
              </p>
            </motion.div>
          }
          { showInstructions &&
            <motion.div layoutId="content" key="instructions" layout>
              <h1>Pairing Instructions</h1>
              <PairingInstructions compact networkStatus={networkStatus} />

              <p>
                <Button size="small" onClick={() => setShowInstructions(false)}>
                  View paired devices.
                </Button>
              </p>
            </motion.div>
          }
        </AnimateSharedLayout>
      </motion.div>
    </InfoWindow>,
  ];
};

DeviceStatus.defaultProps = {
  devices: [],
  deleteDevice: null,
  hasPendingRequest: false,
  loadDevices: () => {},
};

DeviceStatus.propTypes = {
  devices: Types.devices,
  loadDevices: PropTypes.func,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  devices: state.devices,
  hasPendingRequest: selectors.requestIsPending(state),
});

const mapDispatchToProps = dispatch => ({
  deleteDevice: bindActionCreators(actionCreators.deleteDevice, dispatch),
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
  openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
