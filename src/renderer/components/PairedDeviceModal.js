import React from 'react';

import Types, { PropTypes } from '../types';
import { DeviceList, Modal, Overflow } from '../components';

const PairedDeviceList = ({ devices, onComplete, show }) => (
  <Modal
    show={show}
    title="Paired Devices"
    onComplete={onComplete}
    className="modal--paired-devices"
  >
    <div className="paired-device-list">
      <Overflow size="huge">
        <DeviceList devices={devices} />
      </Overflow>
    </div>
  </Modal>
);

PairedDeviceList.defaultProps = {
  devices: [],
  onComplete: () => {},
  show: false,
};

PairedDeviceList.propTypes = {
  devices: Types.devices,
  onComplete: PropTypes.func,
  show: PropTypes.bool,
};

export default PairedDeviceList;
