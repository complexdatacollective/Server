import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';

import AppRoutes from './AppRoutes';
import ProtocolNav from './ProtocolNav';
import { AppMessage, PairPrompt, TabBar } from '../components';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';

// This prevents user from being able to drop a file anywhere on the app
// (which by default triggers a 'save' dialog). If we want to support this,
// we'll need to take action & handle errors based on file types.
const preventGlobalDragDrop = () => {
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
};

/**
 * @class App
 * Main app container.
 * @param props {object} - children
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    preventGlobalDragDrop();

    ipcRenderer.on('PAIRING_CODE_AVAILABLE', (event, data) => {
      props.newPairingRequest(data.pairingCode);
    });

    ipcRenderer.on('PAIRING_COMPLETE', (event, data) => {
      props.completedPairingRequest(data.pairingCode);
    });

    this.props.dismissAppMessages();
  }

  render() {
    const {
      ackPairingRequest,
      dismissAppMessages,
      dismissPairingRequest,
      appMessages,
      pairingRequest,
    } = this.props;

    return (
      <div className="app">
        <div role="Button" tabIndex="0" className="app__flash" onClick={dismissAppMessages}>
          { appMessages.map(msg => <AppMessage key={msg.timestamp} {...msg} />) }
        </div>
        {
          pairingRequest.status === PairingStatus.Pending &&
          <PairPrompt onAcknowledge={ackPairingRequest} onDismiss={dismissPairingRequest} />
        }
        <div className="app__content">
          <ProtocolNav className="app__sidebar" />
          <div className="app__screen">
            <TabBar />
            <main className="app__main">
              <AppRoutes />
            </main>
          </div>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  ackPairingRequest: PropTypes.func.isRequired,
  newPairingRequest: PropTypes.func.isRequired,
  completedPairingRequest: PropTypes.func.isRequired,
  dismissAppMessages: PropTypes.func.isRequired,
  dismissPairingRequest: PropTypes.func.isRequired,
  appMessages: PropTypes.array,
  pairingRequest: PropTypes.shape({
    status: PropTypes.string,
  }),
};

App.defaultProps = {
  appMessages: [],
  pairingRequest: {},
};

const mapStateToProps = ({ pairingRequest, appMessages }) => ({
  pairingRequest,
  appMessages,
});

function mapDispatchToProps(dispatch) {
  return {
    ackPairingRequest: bindActionCreators(actionCreators.acknowledgePairingRequest, dispatch),
    completedPairingRequest: bindActionCreators(actionCreators.completedPairingRequest, dispatch),
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
    dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
    dismissAppMessages: bindActionCreators(messageActionCreators.dismissAppMessages, dispatch),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));

export {
  App as UnconnectedApp,
};
