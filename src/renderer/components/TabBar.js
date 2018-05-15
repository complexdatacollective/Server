import React from 'react';
import { NavLink } from 'react-router-dom';

import DeviceStatus from '../containers/DeviceStatus';

const navLinkProps = {
  activeClassName: 'tab-bar__link--active',
  className: 'tab-bar__link',
};

export default () => (
  <nav className="tab-bar">
    <NavLink {...navLinkProps} to="/overview">Dashboard</NavLink>
    <NavLink {...navLinkProps} to="/settings">Settings</NavLink>

    <div className="tab-bar__secondary">
      <DeviceStatus />
    </div>
  </nav>
);
