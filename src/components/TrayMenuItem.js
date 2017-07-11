import React from 'react';
import PropTypes from 'prop-types';

const TrayMenuItem = ({ children, action }) => (
  <button className="tray__menu-item" onClick={action}>
    {children}
  </button>
);

TrayMenuItem.propTypes = {
  action: PropTypes.func.isRequired,
  children: PropTypes.node,
};

TrayMenuItem.defaultProps = {
  children: null,
};

export default TrayMenuItem;
