import React from 'react';
import PropTypes from 'prop-types';
import { Transition } from 'react-transition-group';

import { getCSSNumber } from '../../utils/css-variables';

const duration = getCSSNumber('--animation-duration-fast-ms');

const transitionStyles = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
};

const Fade = ({ children, transitionIn }) => (
  <Transition appear in={transitionIn} timeout={duration} unmountOnExit>
    {status => (
      <div
        style={{
          transition: `opacity ${duration}ms ease-in-out`,
          opacity: 0,
          ...transitionStyles[status],
        }}
      >
        {children}
      </div>
    )}
  </Transition>
);

Fade.defaultProps = {
  transitionIn: false,
};

Fade.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  transitionIn: PropTypes.bool,
};

export default Fade;
