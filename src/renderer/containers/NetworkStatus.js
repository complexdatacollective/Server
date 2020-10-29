import React from 'react';

const buttonClass = 'device-icon';

const NetworkStatus = ({ serverStatus }) => {
  return (
    <button className={buttonClass}>
      <span className="status-icon__badge" />
    </button>
  );
};

export {
  NetworkStatus as UnconnectedNetworkStatus,
};

export default NetworkStatus;
