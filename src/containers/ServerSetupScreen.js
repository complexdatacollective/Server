import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button } from 'network-canvas-ui';
import { FormWizard } from '../components';
import { ProtocolSelectScreen, ServerIPScreen } from '.';
import { actionCreators as serverSetupActions } from '../ducks/modules/serverSetup';

const prevButton = prevPage => (
  <Button
    key="prev"
    content="Back"
    size="small"
    color="neon-coral"
    onClick={prevPage}
  />
);

const nextButton = nextPage => (
  <Button
    key="next"
    content="Continue"
    size="small"
    color="mustard"
    onClick={nextPage}
  />
);

const ServerSetupScreen = props => (
  <div className="screen">
    <div className="screen__heading">
      <h1 className="screen__heading-title">Network Canvas</h1>
    </div>
    <div className="screen__main">
      <FormWizard
        prevButton={prevButton}
        nextButton={nextButton}
        onSubmit={props.completeSetup}
      >
        <ProtocolSelectScreen />
        <ServerIPScreen />
      </FormWizard>
    </div>
  </div>
);

ServerSetupScreen.propTypes = {
  completeSetup: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return {
    completeSetup: bindActionCreators(serverSetupActions.completeSetup, dispatch),
  };
}

export default connect(null, mapDispatchToProps)(ServerSetupScreen);
