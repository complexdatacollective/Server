import React from 'react';
import PropTypes from 'prop-types';

const TrayMenu = ({ children }) => (
  <div className="tray__menu">
    { children }
  </div>
);

TrayMenu.propTypes = {
  children: PropTypes.node,
};

TrayMenu.defaultProps = {
  children: null,
};

export default TrayMenu;
