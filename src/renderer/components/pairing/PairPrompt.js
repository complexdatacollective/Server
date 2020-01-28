import React from 'react';
import PropTypes from 'prop-types';
import Notify from '@codaco/ui/lib/components/Transitions/Notify';
import { Button, Icon } from '@codaco/ui';

const PairPrompt = ({ onDismiss, onAcknowledge }) => (
  <div className="pairing-prompt">
    <div className="pairing-prompt__icon-wrapper">
      <Icon name="info" className="pairing-prompt__icon" />
    </div>
    <div className="pairing-prompt__content">
      <h1>Pair Device?</h1>
      <p>
        A device is attempting to pair with this computer.
        This will give it access to your interview protocols and allow it to upload data.
      </p>
      <div className="pairing-prompt__buttonGroup">
        <Button color="platinum" onClick={onDismiss}>
          Dismiss
        </Button>
        &nbsp;
        <Button onClick={onAcknowledge}>
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

const AnimatedPairPrompt = ({ show, onAcknowledge, onDismiss }) => (
  <Notify
    in={show}
    appear
    unmountOnExit
  >
    <PairPrompt
      onAcknowledge={onAcknowledge}
      onDismiss={onDismiss}
    />
  </Notify>
);

AnimatedPairPrompt.propTypes = {
  ...PairPrompt.promptTypes,
  show: PropTypes.bool.isRequired,
};

export default PairPrompt;

export {
  AnimatedPairPrompt,
};
