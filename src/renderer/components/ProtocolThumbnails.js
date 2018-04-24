import React from 'react';
import PropTypes from 'prop-types';

import ProtocolThumbnail from './ProtocolThumbnail';
import Types from '../types';

const ProtocolThumbnails = ({ protocols, onClickAddProtocol }) => (
  <div>
    {
      protocols.map(protocol => <ProtocolThumbnail protocol={protocol} key={protocol.id} />)
    }
    <button
      className="protocol-thumbnail protocol-thumbnail--add"
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
