import React from 'react';
import PropTypes from 'prop-types';

const DeviceDetails = ({ device }) => (
  <div className="device">
    <h3 className="device__name">{device.name}</h3>
    <p className="device__id">Paired on: {device.createdAt.toLocaleDateString()}</p>
  </div>
);

DeviceDetails.propTypes = {
  device: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date).isRequired,
  }).isRequired,
};

export default DeviceDetails;
