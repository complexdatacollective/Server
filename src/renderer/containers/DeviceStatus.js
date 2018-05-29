import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import PairedDeviceModal from '../components/PairedDeviceModal';
import { actionCreators } from '../ducks/modules/devices';

class DeviceStatus extends Component {
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
    const { dark, devices } = this.props;
    let buttonClass = 'device-icon';
    if (dark) {
      buttonClass += ` ${buttonClass}--dark`;
    }
    return (
      <React.Fragment>
        <button className={buttonClass} onClick={this.toggleShow}>
          <span className="device-icon__badge">
            {devices.length}
          </span>
        </button>
        <PairedDeviceModal
          devices={devices}
          show={this.state.showModal}
          onComplete={this.toggleShow}
        />
      </React.Fragment>
    );
  }
}

DeviceStatus.defaultProps = {
  dark: false,
  devices: [],
  loadDevices: () => {},
};

DeviceStatus.propTypes = {
  dark: PropTypes.bool,
  devices: Types.devices,
  loadDevices: PropTypes.func,
};

const mapStateToProps = ({ devices }) => ({
  devices,
});

const mapDispatchToProps = dispatch => ({
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
