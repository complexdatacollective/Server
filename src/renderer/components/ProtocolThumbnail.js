import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { replace } from 'lodash';

import Types from '../types';

const nickname = (name = '') => name.substr(0, 2);

class ProtocolThumbnail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hover: false };
  }

  getSchemaColorIndex = (version) => {
    const parsedVersion = parseInt(replace(version, /\./g, ''), 10);
    if (isNaN(parsedVersion)) {
      return 0;
    }
    return (parsedVersion % 9) + 1;
  }

  render() {
    const { protocol } = this.props;
    const schemaColorIndex = this.getSchemaColorIndex(protocol.schemaVersion);
    const protocolColorClasses = cx(
      'protocol-thumbnail',
      {
        [`protocol-thumbnail__schema-color-seq-${schemaColorIndex}`]: schemaColorIndex,
      },
    );

    return (
      <NavLink
        className={protocolColorClasses}
        activeClassName="protocol-thumbnail--active"
        to={`/workspaces/${protocol.id}`}
      >
        { nickname(protocol.name) }
      </NavLink>
    );
  }
}

ProtocolThumbnail.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default ProtocolThumbnail;
