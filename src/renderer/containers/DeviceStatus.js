import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Types from '../types';
import { actionCreators } from '../ducks/modules/devices';
import { selectors } from '../ducks/modules/pairingRequest';

class DeviceStatus extends Component {
  static getDerivedStateFromProps(props, state) {
    if (props.hasPendingRequest) {
      // Close the instructions when a pairing request arrives
      return { ...state, showModal: false };
    }
    return state;
  }

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  componentDidMount() {
    this.props.loadDevices();
  }

  render() {
    const { devices, history } = this.props;

    return (
      <div className="device-status">
        <button className="device-status__icon" onClick={() => history.push('/devices')}>
          <span className="device-status__badge">
            {devices ? devices.length : ''}
          </span>
        </button>

        Devices
      </div>
    );
  }
}

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
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
