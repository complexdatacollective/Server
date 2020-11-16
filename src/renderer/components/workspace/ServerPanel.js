import React from 'react';
import PropTypes from 'prop-types';
import DeviceStatus from '../../containers/DeviceStatus';
import NetworkStatus from '../../containers/NetworkStatus';
import { appVersion } from '../../utils/appVersion';
import NCLogo from '../../images/NC-Mark.svg';
import ServerLogo from '../../images/Srv-Flat.svg';

const versionParts = appVersion.split('-');

const ServerPanel = ({ className }) => (
  <div className={`server-panel ${className}`}>
    <div className="app-version">
      {/* Server is part of the <img src={NCLogo} alt="Network Canvas Project" /> Network Canvas Project.
      <h6>Network Canvas</h6> */}
      <div>Version {versionParts[0]} {versionParts[1]}</div>
      {/* <img src={ServerLogo} alt="Network Canvas Server" /> */}
      {/* <h4>Server</h4> */}
    </div>
    <div className="server-panel__wrapper">
      <NetworkStatus />
      <DeviceStatus />
    </div>
  </div>
);

ServerPanel.defaultProps = {
  className: '',
};

ServerPanel.propTypes = {
  className: PropTypes.string,
};

export {
  ServerPanel as UnwrappedServerPanel,
};

export default ServerPanel;
