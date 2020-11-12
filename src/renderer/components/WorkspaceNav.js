import React from 'react';
import overview from '../images/overview.svg';
import share from '../images/share.svg';
import cases from '../images/cases.svg';
import settings from '../images/settings.svg';

function WorkspaceNav() {
  return (
    <div className="workspace-nav">
      <ul>
        <li className="active"><img src={overview} alt="overview" /> Overview</li>
        <li><img src={cases} alt="cases" /> View Cases</li>
        <li><img src={share} alt="share" /> Export</li>
        <li><img src={settings} alt="settings" /> Settings</li>
      </ul>
    </div>
  );
}

export default WorkspaceNav;
