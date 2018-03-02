import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'network-canvas-ui/lib/components';

const PinChar = ({ char }) => (<div className="pairing-pin__char">{char}</div>);
PinChar.propTypes = {
  char: PropTypes.string.isRequired,
};

const PairPin = ({ code = '' }) => {
  const chars = code.split('');
  return (
    <div className="pairing-pin">
      <h1>Pair a device</h1>
      <p>
        To pair your Network Canvas client with this installation of Server,
        type the code shown below into the prompt on the device running Network Canvas.
      </p>
      <div className="pairing-pin__code">
        {chars.map((c, i) => <PinChar key={i} char={c} />)}
      </div>

      <div className="pairing-pin__buttonGroup">
        <Button color="tomato" size="small">
          Cancel
        </Button>
      </div>
    </div>
  );
};

PairPin.propTypes = {
  code: PropTypes.string,
};

PairPin.defaultProps = {
  code: '',
};

export default PairPin;
