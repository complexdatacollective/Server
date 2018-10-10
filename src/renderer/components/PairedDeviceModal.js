import React from 'react';

import Types, { PropTypes } from '../types';
import { DeviceList, Modal, Overflow } from '../components';

const PairedDeviceModal = ({ deleteDevice, devices, onComplete, show }) => (
  <Modal
    closeWhenBackgroundClicked
    show={show}
    title="Paired Devices"
    onComplete={onComplete}
    className="modal--paired-devices"
  >
    <div className="paired-device-list">
      <Overflow size="huge">
        <DeviceList deleteDevice={deleteDevice} devices={devices} />
      </Overflow>
    </div>
  </Modal>
);

PairedDeviceModal.defaultProps = {
  deleteDevice: null,
  devices: [],
  onComplete: () => {},
  show: false,
};

PairedDeviceModal.propTypes = {
  deleteDevice: PropTypes.func,
  devices: Types.devices,
  onComplete: PropTypes.func,
  show: PropTypes.bool,
};

export default PairedDeviceModal;
