import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';

import { getCSSNumber } from '../../utils/css-variables';

// Assume user is only overriding custom props at root
const duration = getCSSNumber('--animation-duration-fast-ms');

const SlideDown = ({ children, transitionIn, ...props }) => (
  <CSSTransition classNames="slide-down" timeout={duration} {...props}>
    {children}
  </CSSTransition>
);

SlideDown.defaultProps = {
  transitionIn: false,
};

SlideDown.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  transitionIn: PropTypes.bool,
};

export default SlideDown;
