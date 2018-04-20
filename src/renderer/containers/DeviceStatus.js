import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import { actionCreators } from '../ducks/modules/devices';

class DeviceStatus extends Component {
  componentDidMount() {
    this.props.loadDevices();
  }

  render() {
    const deviceCount = this.props.devices.length;
    return (
      <button className="device-icon">
        <span className="device-icon__badge">
          {deviceCount}
        </span>
      </button>
    );
  }
}

DeviceStatus.defaultProps = {
  devices: [],
  loadDevices: () => {},
};

DeviceStatus.propTypes = {
  devices: Types.devices,
  loadDevices: PropTypes.func,
};

const mapStateToProps = reduxState => ({
  devices: reduxState.devices,
});

const mapDispatchToProps = dispatch => ({
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
