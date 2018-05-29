/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, withRouter } from 'react-router-dom';

import DeviceStatus from '../containers/DeviceStatus';

const navLinkProps = {
  activeClassName: 'tab-bar__link--active',
  className: 'tab-bar__link',
};

const TabBar = ({ match }) => {
  const workspaceId = match.params.id;
  return (
    <nav className="tab-bar">
      <NavLink exact {...navLinkProps} to={`/workspaces/${workspaceId}`}>
        Dashboard
      </NavLink>
      <NavLink exact {...navLinkProps} to={`/workspaces/${workspaceId}/settings`}>
        Settings
      </NavLink>

      <div className="tab-bar__secondary">
        <DeviceStatus />
      </div>
    </nav>
  );
};

TabBar.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }),
};

export default withRouter(TabBar);

export { TabBar as UnconnectedTabBar  };
