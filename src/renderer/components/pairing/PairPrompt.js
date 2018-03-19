import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'network-canvas-ui/lib/components';
import { withRouter, Link } from 'react-router-dom';

const PairPrompt = ({ location, onDismiss }) => (
  <div className="pairing-prompt">
    <Icon name="info" className="pairing-prompt__icon" />
    <div className="pairing-prompt__content">
      <h1>Pair Device?</h1>
      <p>
        A device is attempting to pair with this computer.
        This will give it access to your interview protocols and allow it to upload data.
      </p>
      <div className="pairing-prompt__buttonGroup">
        <Button color="platinum" size="small" onClick={onDismiss}>
          Dismiss
        </Button>
        &nbsp;
        {
          <Link to={`${location.pathname}/modal/pair`} className="pairing-prompt__button button button--small">
            <span className="button__content">Pair With Device</span>
          </Link>
        }
      </div>
    </div>
    <div className="pairing-prompt__close">
      <Icon name="close" onClick={onDismiss} />
    </div>
  </div>
);

PairPrompt.propTypes = {
  location: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default withRouter(PairPrompt);
