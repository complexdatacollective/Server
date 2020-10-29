import React from 'react';
import PropTypes from 'prop-types';
import DeviceStatus from '../../containers/DeviceStatus';
import NetworkStatus from '../../containers/NetworkStatus';

const ServerPanel = ({ className }) => (
  <div className={`server-panel ${className}`}>
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
