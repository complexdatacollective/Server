import React from 'react';
import PropTypes from 'prop-types';

const PinChar = ({ char }) => (<div className="pairing-pin__char">{char}</div>);

// Placeholder to display when code is unavailable (e.g., during transitions)
const placeholder = '------------';

PinChar.propTypes = {
  char: PropTypes.string.isRequired,
};

const PairPin = ({ code }) => {
  const chars = code.split('');
  return (
    <div className="pairing-pin">
      <p className="pairing-pin__description">
        To pair your Network Canvas client with this installation of Server,
        type the code shown below into the prompt on the device running Network Canvas.
      </p>
      <div className="pairing-pin__code">
        {chars.map((c, i) => <PinChar key={`${i}.${c}`} char={c} />)}
      </div>
    </div>
  );
};

PairPin.defaultProps = {
  code: placeholder,
};

PairPin.propTypes = {
  code: PropTypes.string,
};

export default PairPin;
