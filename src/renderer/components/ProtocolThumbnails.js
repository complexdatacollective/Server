import React from 'react';

import Types from '../types';

const nickname = (name = '') => name.substr(0, 2);

const ProtocolThumbnails = ({ protocols }) => (
  <div className="protocol-thumbnails">
    {
      protocols.map(protocol => (
        <div key={protocol.id} className="protocol-thumbnails__thumbnail" title={protocol.filename}>
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
  protocols: Types.protocols,
};

export default ProtocolThumbnails;
