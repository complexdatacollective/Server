import React from 'react';
import { NavLink } from 'react-router-dom';

const navLinkProps = {
  activeClassName: 'tab-bar__link--active',
  className: 'tab-bar__link',
};

export default () => (
  <nav className="tab-bar">
    <NavLink {...navLinkProps} to="/dashboard">Dashboard</NavLink>
    <NavLink {...navLinkProps} to="/settings">Settings</NavLink>
  </nav>
);
