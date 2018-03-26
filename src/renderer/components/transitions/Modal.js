import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import { getCSSNumber } from '../../utils/css-variables';

const duration = {
  enter: getCSSNumber('--animation-duration-fast-ms'),
  exit: getCSSNumber('--animation-duration-fast-ms'),
};

const Modal = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={duration}
    classNames="transition--window"
    appear
    unmountOnExit
  >
    { children }
  </CSSTransition>
);

Modal.propTypes = {
  children: PropTypes.any.isRequired,
};

export default Modal;
