import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '../ui/components';

const DismissButton = ({ children, className, inline, onClick, small, title }) => {
  let baseClass = 'dismiss-button';
  if (className) { baseClass += ` ${className}`; }
  if (small) { baseClass += ' dismiss-button--small'; }
  if (inline) { baseClass += ' dismiss-button--inline'; }

  return (
    <a onClick={onClick} className={baseClass} role="button" tabIndex={0}>
      <Icon name="close" className="dismiss-button__icon" />
      {title || children}
    </a>
  );
};

DismissButton.defaultProps = {
  children: '',
  className: '',
  inline: false,
  small: false,
  title: '',
};

DismissButton.propTypes = {
  children: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  inline: PropTypes.bool,
  small: PropTypes.bool,
  title: PropTypes.string,
};

export default DismissButton;
