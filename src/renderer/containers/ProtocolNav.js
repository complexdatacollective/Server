import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import { actionCreators } from '../ducks/modules/protocols';
import FileDropTarget from './FileDropTarget';
import ProtocolThumbnails from '../components/ProtocolThumbnails';
import AdminApiClient from '../utils/adminApiClient';

class ProtocolNav extends Component {
  constructor(props) {
    super(props);
    this.apiClient = new AdminApiClient();
  }

  componentDidMount() {
    this.props.loadProtocols();
  }

  render() {
    const { className, protocols } = this.props;
    return (
      <nav className={className}>
        <FileDropTarget>
          <ProtocolThumbnails protocols={protocols} />
        </FileDropTarget>
      </nav>
    );
  }
}

ProtocolNav.defaultProps = {
  className: '',
  protocols: [],
};

ProtocolNav.propTypes = {
  className: PropTypes.string,
  loadProtocols: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

const mapStateToProps = reduxState => ({
  protocols: reduxState.protocols,
});

const mapDispatchToProps = dispatch => ({
  loadProtocols: bindActionCreators(actionCreators.loadProtocols, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProtocolNav);

export {
  ProtocolNav as UnconnectedProtocolNav,
};
