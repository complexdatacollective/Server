import React from 'react';
import PropTypes from 'prop-types';

const MenuItem = ({ children, action, ...props }) => (
  <button {...props} onClick={action}>
    {children}
  </button>
);

MenuItem.propTypes = {
  action: PropTypes.func.isRequired,
  children: PropTypes.node,
};

MenuItem.defaultProps = {
  children: null,
};

export default MenuItem;
