import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { sortBy } from 'lodash';
import ProtocolThumbnail from './ProtocolThumbnail';
import Types from '../types';

const ProtocolThumbnails = ({ location, protocols, onClickAddProtocol }) => {
  useEffect(() => {
    ReactTooltip.rebuild();
  });

  const sortedProtocols = sortBy(protocols, 'name');

  return (
    <div className="protocol-thumbnails">
      {
        sortedProtocols && sortedProtocols.map((protocol) => (
          <div data-tip={protocol.name} data-for="protocol-tooltip" key={protocol.id}><ProtocolThumbnail location={location} protocol={protocol} /></div>
        ))
      }
      <div data-tip="Create a new workspace from a protocol" data-for="protocol-tooltip">
        <button
          type="button"
          aria-label="Create workspace"
          className="protocol-thumbnail protocol-thumbnail--add"
          onClick={onClickAddProtocol}
        />
      </div>
      <ReactTooltip
        id="protocol-tooltip"
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
  location: PropTypes.object, // location is needed for nav items to update active state during nav
  onClickAddProtocol: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

export default ProtocolThumbnails;
