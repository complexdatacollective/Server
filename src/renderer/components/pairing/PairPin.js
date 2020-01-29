import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@codaco/ui';

const PinChar = ({ char }) => (<div className="pairing-pin__char">{char}</div>);

// Placeholder to display when code is unavailable (e.g., during transitions)
const placeholder = '------------';

PinChar.propTypes = {
  char: PropTypes.string.isRequired,
};

const PairPin = ({ code, dismissPairingRequest }) => {
  const chars = code.split('');
  return (
    <div className="pairing-pin">
      <h1>Pairing Code</h1>
      <p className="pairing-pin__description">
        To pair your Network Canvas client with this installation of Server,
        type the code shown below into the prompt on the device running Network Canvas.
      </p>
      <div className="pairing-pin__code">
        {chars.map((c, i) => <PinChar key={`${i}.${c}`} char={c} />)}
      </div>
      <div className="button-footer">
        <Button color="platinum" onClick={dismissPairingRequest}>Cancel</Button>
      </div>
    </div>
  );
};

PairPin.defaultProps = {
  code: placeholder,
};

PairPin.propTypes = {
  code: PropTypes.string,
  dismissPairingRequest: PropTypes.func.isRequired,
};

export default PairPin;
