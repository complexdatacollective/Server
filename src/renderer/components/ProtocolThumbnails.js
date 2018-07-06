import React from 'react';
import PropTypes from 'prop-types';

import ProtocolThumbnail from './ProtocolThumbnail';
import Types from '../types';

const ProtocolThumbnails = ({ location, protocols, onClickAddProtocol }) => (
  <div>
    {
      protocols && protocols.map(protocol => (
        <ProtocolThumbnail location={location} protocol={protocol} key={protocol.id} />
      ))
    }
    <button
      className="protocol-thumbnail protocol-thumbnail--add"
      onClick={onClickAddProtocol}
    />
  </div>
);

ProtocolThumbnails.defaultProps = {
  location: {},
  protocols: [],
};

ProtocolThumbnails.propTypes = {
  // location is needed for nav items to update active state during nav
  location: PropTypes.object,
  onClickAddProtocol: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

export default ProtocolThumbnails;
