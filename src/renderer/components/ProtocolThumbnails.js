import React from 'react';
import PropTypes from 'prop-types';

const nickname = (name = '') => name.substr(0, 2);

const ProtocolThumbnails = ({ protocols }) => (
  <div className="protocol-thumbnails">
    {
      protocols.map(protocol => (
        <div key={protocol.id} className="protocol-thumbnails__thumbnail">
          {nickname(protocol.name)}
        </div>
      ))
    }
  </div>
);

ProtocolThumbnails.defaultProps = {
  protocols: [],
};

ProtocolThumbnails.propTypes = {
  protocols: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date).isRequired,
  })),
};

export default ProtocolThumbnails;
