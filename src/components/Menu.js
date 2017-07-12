import React from 'react';
import PropTypes from 'prop-types';

const Menu = ({ children, ...props }) => (
  <div {...props}>
    { children }
  </div>
);

Menu.propTypes = {
  children: PropTypes.node,
};

Menu.defaultProps = {
  children: null,
};

export default Menu;
