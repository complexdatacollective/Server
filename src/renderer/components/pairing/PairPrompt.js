import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'network-canvas-ui/lib/components';

const PairPrompt = ({ onDismiss, onAcknowledge }) => (
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
        <Button size="small" onClick={onAcknowledge}>
          Pair With Device
        </Button>
      </div>
    </div>
  </div>
);

PairPrompt.propTypes = {
  onAcknowledge: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default PairPrompt;
