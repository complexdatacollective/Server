import React from 'react';
import PropTypes from 'prop-types';

const DeviceDetails = ({ device }) => (
  <div className="device">
    <h3 className="device__name">{device.name}</h3>
    <p className="device__info">{device.id}</p>
    <p className="device__info">Paired on: {device.createdAt.toLocaleDateString()}</p>
  </div>
);

DeviceDetails.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date).isRequired,
  }).isRequired,
};

export default DeviceDetails;
