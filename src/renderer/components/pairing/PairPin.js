import React from 'react';
import PropTypes from 'prop-types';

const PinChar = ({ char }) => (<div className="pairing-pin__char">{char}</div>);

PinChar.propTypes = {
  char: PropTypes.string.isRequired,
};

const PairPin = ({ code }) => {
  const chars = code.split('');
  return (
    <div className="pairing-pin">
      <p>
        To pair your Network Canvas client with this installation of Server,
        type the code shown below into the prompt on the device running Network Canvas.
      </p>
      <div className="pairing-pin__code">
        {chars.map((c, i) => <PinChar key={`${i}.${c}`} char={c} />)}
      </div>
    </div>
  );
};

PairPin.propTypes = {
  code: PropTypes.string.isRequired,
};

export default PairPin;