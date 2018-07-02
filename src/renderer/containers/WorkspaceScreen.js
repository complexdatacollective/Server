import React, { Component } from 'react';
import { connect } from 'react-redux';

import Types from '../types';
import Workspace from '../components/Workspace';
import { Spinner } from '../ui';
import { selectors } from '../ducks/modules/protocols';

class WorkspaceScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { devices, protocol } = this.props;
    if (!protocol) {
      return <div className="workspace--loading"><Spinner /></div>;
    }
    return <Workspace protocol={protocol} devices={devices} />;
  }
}

const mapStateToProps = (state, ownProps) => ({
  devices: state.devices,
  protocol: selectors.currentProtocol(state, ownProps),
});

WorkspaceScreen.defaultProps = {
  devices: null,
  protocol: null,
};

WorkspaceScreen.propTypes = {
  devices: Types.devices,
  protocol: Types.protocol,
};

export default connect(mapStateToProps)(WorkspaceScreen);

export { WorkspaceScreen as UnconnectedWorkspaceScreen };
