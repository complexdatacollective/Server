import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';

import PairPrompt from '../components/pairing/PairPrompt';

import AppRoutes from './AppRoutes';
import { Header, TabBar } from '../components';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';

require('../styles/main.scss');

/**
 * @class App
  * Main app container.
  * @param props {object} - children
  */
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    ipcRenderer.on('PAIRING_CODE_AVAILABLE', (event, data) => {
      props.newPairingRequest(data.pairingCode);
    });

    ipcRenderer.on('PAIRING_COMPLETE', (event, data) => {
      props.completedPairingRequest(data.pairingCode);
    });
  }

  render() {
    const { ackPairingRequest, dismissPairingRequest, pairingRequest } = this.props;
    return (
      <div className="app">
        <Header pairingCode={this.state.pairingCode} className="app__header" />
        {
          pairingRequest.status === PairingStatus.Pending &&
          <PairPrompt onAcknowledge={ackPairingRequest} onDismiss={dismissPairingRequest} />
        }
        <div className="app__content">
          <nav className="app__sidebar" />
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
  dismissPairingRequest: PropTypes.func.isRequired,
  pairingRequest: PropTypes.shape({
    status: PropTypes.string,
  }),
};

App.defaultProps = {
  pairingRequest: {},
};

const mapStateToProps = ({ pairingRequest }) => ({
  pairingRequest,
});

function mapDispatchToProps(dispatch) {
  return {
    ackPairingRequest: bindActionCreators(actionCreators.acknowledgePairingRequest, dispatch),
    completedPairingRequest: bindActionCreators(actionCreators.completedPairingRequest, dispatch),
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
    dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));

export {
  App as UnconnectedApp,
};
