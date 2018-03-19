import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';

import PairPrompt from '../components/pairing/PairPrompt';

import AppRoutes from './AppRoutes';
import { Header, TabBar } from '../components';
import { actionCreators } from '../ducks/modules/pairing';

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
      this.setState({ pairingAvailable: !!data.pairingCode });
    });

    this.onDismissPairing = this.onDismissPairing.bind(this);
  }

  onDismissPairing() {
    this.setState({ pairingAvailable: false });
  }

  render() {
    return (
      <div className="app">
        <Header pairingCode={this.state.pairingCode} className="app__header" />
        {
          this.state.pairingAvailable &&
          <PairPrompt onDismiss={this.onDismissPairing} />
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
  newPairingRequest: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
  };
}

export default withRouter(connect(null, mapDispatchToProps)(App));
