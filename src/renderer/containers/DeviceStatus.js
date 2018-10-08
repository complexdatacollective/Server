import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import PairedDeviceModal from '../components/PairedDeviceModal';
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

  toggleShow = () => {
    this.setState({ showModal: !this.state.showModal });
  }

  render() {
    const { dark, deleteDevice, devices, hasPendingRequest } = this.props;
    let buttonClass = 'device-icon';
    if (dark) {
      buttonClass += ` ${buttonClass}--dark`;
    }
    return (
      <React.Fragment>
        <button className={buttonClass} onClick={this.toggleShow}>
          <span className="device-icon__badge">
            {devices ? devices.length : ''}
          </span>
        </button>
        <PairedDeviceModal
          devices={devices}
          show={this.state.showModal && !hasPendingRequest}
          onComplete={this.toggleShow}
          deleteDevice={deleteDevice}
        />
      </React.Fragment>
    );
  }
}

DeviceStatus.defaultProps = {
  dark: false,
  devices: [],
  deleteDevice: null,
  hasPendingRequest: false,
  loadDevices: () => {},
};

DeviceStatus.propTypes = {
  dark: PropTypes.bool,
  deleteDevice: PropTypes.func,
  devices: Types.devices,
  hasPendingRequest: PropTypes.bool,
  loadDevices: PropTypes.func,
};

const mapStateToProps = state => ({
  devices: state.devices,
  hasPendingRequest: selectors.requestIsPending(state),
});

const mapDispatchToProps = dispatch => ({
  deleteDevice: bindActionCreators(actionCreators.deleteDevice, dispatch),
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
