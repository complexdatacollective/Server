import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import ProtocolThumbnail from './ProtocolThumbnail';
import Types from '../types';

const ProtocolThumbnails = ({ location, protocols, onClickAddProtocol }) => {
  useEffect(() => {
    ReactTooltip.rebuild();
  });
  return (
    <div className="protocol-thumbnails">
      {
        protocols && protocols.sort().map(protocol => (
          <div data-tip={protocol.name} data-for="foo" key={protocol.id}><ProtocolThumbnail location={location} protocol={protocol} /></div>
        ))
      }
      <button
        className="protocol-thumbnail protocol-thumbnail--add"
        onClick={onClickAddProtocol}
      />
      <p data-tip="hello world" data-for="foo">Tooltip</p>
      <ReactTooltip
        id="foo"
        delayShow={300}
        place="right"
        effect="solid"
      />
    </div>
  );
};

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
