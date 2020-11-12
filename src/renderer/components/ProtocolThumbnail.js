import React, { PureComponent } from 'react';
import Identicon from 'react-identicons';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import { getCSSVariableAsString } from '@codaco/ui/lib/utils/CSSVariables';
import Types from '../types';

const nickname = (name = '') => name.substr(0, 2);

class ProtocolThumbnail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hover: false };

    this.palette = [
      getCSSVariableAsString('--cat-color-seq-1'),
      getCSSVariableAsString('--cat-color-seq-2'),
      getCSSVariableAsString('--cat-color-seq-3'),
      getCSSVariableAsString('--cat-color-seq-4'),
      getCSSVariableAsString('--cat-color-seq-5'),
      getCSSVariableAsString('--cat-color-seq-6'),
      getCSSVariableAsString('--cat-color-seq-7'),
      getCSSVariableAsString('--cat-color-seq-8'),
    ];
  }

  render() {
    const { protocol } = this.props;
    const protocolColorClasses = cx(
      'protocol-thumbnail',
    );

    return (
      <NavLink
        className={protocolColorClasses}
        activeClassName="protocol-thumbnail--active"
        to={`/workspaces/${protocol.id}`}
      >
        <Identicon string={protocol.name} count={5} size="45" palette={this.palette} />
        <span className="label">{ nickname(protocol.name) }</span>
      </NavLink>
    );
  }
}

ProtocolThumbnail.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default ProtocolThumbnail;
