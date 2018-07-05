import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import { actionCreators as currentProtocolCreators } from '../ducks/modules/currentProtocolId';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { Button, Spinner } from '../ui';

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const id = this.props.match.params.id;
    this.props.setCurrentProtocol(id);
  }

  deleteProtocol = () => {
    const { deleteProtocol, currentProtocolId } = this.props;
    // eslint-disable-next-line no-alert
    if (currentProtocolId && confirm('Destroy this protocol and all related data?')) {
      deleteProtocol(currentProtocolId);
    }
  }

  render() {
    const { protocol, protocolsHaveLoaded } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    return (
      <div className="settings">
        <h1>{protocol.name}</h1>
        <div className="settings__section">
          <div className="settings__description">
            <h3>Delete this protocol</h3>
            <p>
              This will permanently remove this Server’s copy of the protocol file
              and any associated data that has been imported.
            </p>
          </div>
          <div className="settings__action">
            <Button size="small" color="tomato" onClick={this.deleteProtocol}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ currentProtocolId, protocols }) => ({
  currentProtocolId,
  protocolsHaveLoaded: !!protocols,
  protocol: protocols && protocols.find(p => p.id === currentProtocolId),
});

const mapDispatchToProps = dispatch => ({
  deleteProtocol: bindActionCreators(protocolActionCreators.deleteProtocol, dispatch),
  setCurrentProtocol: bindActionCreators(currentProtocolCreators.setCurrentProtocol, dispatch),
});

SettingsScreen.defaultProps = {
  apiClient: null,
  currentProtocolId: null,
  protocol: null,
};

SettingsScreen.propTypes = {
  currentProtocolId: PropTypes.string,
  deleteProtocol: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  setCurrentProtocol: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);

export {
  SettingsScreen as UnconnectedSettingsScreen,
};
