import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import { GetStarted } from '../components';
import { actionCreators } from '../ducks/modules/devices';

class OverviewScreen extends Component {
  componentDidMount() {
    this.props.loadDevices();
  }

  render() {
    const { deviceApiInfo, devices, protocols } = this.props;
    if (protocols && protocols.length) {
      return <Redirect to={`/workspaces/${protocols[0].id}`} />;
    }
    if (protocols && devices) {
      return <GetStarted devices={devices} apiInfo={deviceApiInfo} />;
    }
    // else still loading...
    return null;
  }
}

OverviewScreen.defaultProps = {
  deviceApiInfo: null,
  devices: null,
  protocols: null,
};

OverviewScreen.propTypes = {
  deviceApiInfo: Types.deviceApiInfo,
  devices: Types.devices,
  loadDevices: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

const mapStateToProps = ({ connectionInfo, devices, protocols }) => ({
  devices,
  protocols,
  deviceApiInfo: connectionInfo && connectionInfo.deviceService,
});

const mapDispatchToProps = dispatch => ({
  loadDevices: bindActionCreators(actionCreators.loadDevices, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(OverviewScreen);

export { OverviewScreen as UnconnectedOverviewScreen };
