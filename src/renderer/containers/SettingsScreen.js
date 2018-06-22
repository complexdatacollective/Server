import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import { actionCreators } from '../ducks/modules/currentProtocolId';
import { Spinner } from '../ui';

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.setCurrentProtocol(id);
  }

  render() {
    const { protocol } = this.props;
    if (!protocol) {
      return <div className="settings--loading"><Spinner /></div>;
    }
    return (
      <div>
        <h1>{protocol.name}</h1>
      </div>
    );
  }
}

const mapStateToProps = ({ currentProtocolId, protocols }) => ({
  protocol: protocols.find(p => p.id === currentProtocolId),
});

const mapDispatchToProps = dispatch => ({
  setCurrentProtocol: bindActionCreators(actionCreators.setCurrentProtocol, dispatch),
});

SettingsScreen.defaultProps = {
  protocol: null,
};

SettingsScreen.propTypes = {
  match: PropTypes.object.isRequired,
  protocol: Types.protocol,
  setCurrentProtocol: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);

export {
  SettingsScreen as UnconnectedSettingsScreen,
};
