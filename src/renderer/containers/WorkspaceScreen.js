import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import Workspace from '../components/Workspace';
import { actionCreators } from '../ducks/modules/protocol';
import { Spinner } from '../ui';

class WorkspaceScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.loadProtocol(id);
  }

  componentDidUpdate(prevProps) {
    const id = this.props.match.params.id;
    if (id !== prevProps.match.params.id) {
      this.props.loadProtocol(id);
    }
  }

  render() {
    const { protocol } = this.props;
    if (!protocol) {
      return <div className="workspace--loading"><Spinner /></div>;
    }
    return <Workspace protocol={protocol} />;
  }
}

const mapStateToProps = ({ protocol }) => ({
  protocol,
});

const mapDispatchToProps = dispatch => ({
  loadProtocol: bindActionCreators(actionCreators.loadProtocol, dispatch),
});

WorkspaceScreen.defaultProps = {
  protocol: null,
};

WorkspaceScreen.propTypes = {
  loadProtocol: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  protocol: Types.protocol,
};

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceScreen);

export { WorkspaceScreen as UnconnectedWorkspaceScreen };
