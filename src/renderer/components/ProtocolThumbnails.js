import React from 'react';
import PropTypes from 'prop-types';

import Types from '../types';

const nickname = (name = '') => name.substr(0, 2);

const ProtocolThumbnails = ({ protocols, onClickAddProtocol }) => (
  <div className="protocol-thumbnails">
    {
      protocols.map(protocol => (
        <div key={protocol.id} className="protocol-thumbnails__thumbnail" title={protocol.filename}>
          {nickname(protocol.name)}
        </div>
      ))
    }
    <button
      className="protocol-thumbnails__thumbnail protocol-thumbnails__thumbnail--add"
      onClick={onClickAddProtocol}
    />
  </div>
);

ProtocolThumbnails.defaultProps = {
  protocols: [],
};

ProtocolThumbnails.propTypes = {
  onClickAddProtocol: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

export default ProtocolThumbnails;
