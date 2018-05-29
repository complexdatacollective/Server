import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

import Types from '../types';

const nickname = (name = '') => name.substr(0, 2);

class ProtocolThumbnail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hover: false };
  }

  render() {
    const { protocol } = this.props;
    return (
      <NavLink
        className="protocol-thumbnail"
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
