import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Types from '../types';
import { actionCreators } from '../ducks/modules/protocol';
import { Spinner } from '../ui';

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.loadProtocol(id);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.protocol.id !== (this.props.protocol && this.props.protocol.id);
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

const mapStateToProps = ({ protocol }) => ({
  protocol,
});

const mapDispatchToProps = dispatch => ({
  loadProtocol: bindActionCreators(actionCreators.loadProtocol, dispatch),
});

SettingsScreen.defaultProps = {
  protocol: null,
};

SettingsScreen.propTypes = {
  loadProtocol: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  protocol: Types.protocol,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);

export {
  SettingsScreen as UnconnectedSettingsScreen,
};
