import React from 'react';
import PropTypes from 'prop-types';
import DeviceStatus from '../../containers/DeviceStatus';
import NetworkStatus from '../../containers/NetworkStatus';

const TopPanel = ({ className, children, networkStatusError }) => (
  <div className={`top-panel ${className}`}>
    <div className="top-panel__wrapper">
      <NetworkStatus networkStatusError={networkStatusError} />
      <div className="divider" />
      <DeviceStatus />
    </div>
    {children}
  </div>
);

TopPanel.defaultProps = {
  className: '',
  networkStatusError: false,
};

TopPanel.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  networkStatusError: PropTypes.bool,
};

export {
  TopPanel as UnwrappedTopPanel,
};

export default TopPanel;
