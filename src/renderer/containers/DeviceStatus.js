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
    const { dark, devices, history } = this.props;
    let buttonClass = 'device-icon';
    if (dark) {
      buttonClass += ` ${buttonClass}--dark`;
    }
    return (
      <React.Fragment>
        <button className={buttonClass} onClick={() => history.push('/devices')}>
          <span className="device-icon__badge">
            {devices ? devices.length : ''}
          </span>
        </button>
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
  devices: Types.devices,
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

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
