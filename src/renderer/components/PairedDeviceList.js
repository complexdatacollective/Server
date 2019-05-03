import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actionCreators } from '../ducks/modules/devices';
import Types, { PropTypes } from '../types';
import { DeviceList } from '.';

const PairedDeviceList = ({ deleteDevice, devices }) => (
  <div className="paired-device-list">
    <div className="paired-device-list__header">
      <h1>Paired Devices</h1>
      <p>
        Below you can find a list of all devices currently paired with this installation
        of Server.
      </p>
    </div>
    <DeviceList deleteDevice={deleteDevice} devices={devices} />
  </div>
);

PairedDeviceList.defaultProps = {
  deleteDevice: null,
  devices: [],
  onClose: () => {},
  show: false,
};

PairedDeviceList.propTypes = {
  deleteDevice: PropTypes.func,
  devices: Types.devices,
};

const mapStateToProps = state => ({
  devices: state.devices,
});

const mapDispatchToProps = dispatch => ({
  deleteDevice: bindActionCreators(actionCreators.deleteDevice, dispatch),
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(PairedDeviceList);
