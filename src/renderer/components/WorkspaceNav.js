import React from 'react';
import { get } from 'lodash';
import { NavLink, withRouter } from 'react-router-dom';
import overview from '../images/overview.svg';
import share from '../images/share.svg';
import cases from '../images/cases.svg';
import settings from '../images/settings.svg';

function WorkspaceNav(props) {
  const protocolId = get(props, 'match.params.id');
  return (
    <div className="workspace-nav">
      <ul>
        <NavLink exact activeClassName="active" to={`/workspaces/${protocolId}`}><li><img src={overview} alt="overview" />Overview</li></NavLink>
        <NavLink exact activeClassName="active" to={`/workspaces/${protocolId}/casemanagement`}><li><img src={cases} alt="cases" />Manage Cases</li></NavLink>
        <NavLink exact activeClassName="active" to={`/workspaces/${protocolId}/export`}><li><img src={share} alt="share" />Export Data</li></NavLink>
        <NavLink exact activeClassName="active" to={`/workspaces/${protocolId}/settings`}><li><img src={settings} alt="settings" />Settings</li></NavLink>
      </ul>
    </div>
  );
}

export default withRouter(WorkspaceNav);
