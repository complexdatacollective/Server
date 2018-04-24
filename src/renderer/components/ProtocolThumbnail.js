import React, { PureComponent } from 'react';

import Types from '../types';

const cssBlock = 'protocol-thumbnail';
const nickname = (name = '') => name.substr(0, 2);

class ProtocolThumbnail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { hover: false };
  }

  render() {
    const { protocol } = this.props;
    const detailsClass = `${cssBlock}__details`;
    let tooltipClass = detailsClass;
    if (this.state.hover) {
      tooltipClass += ` ${detailsClass}--active`;
    }

    return (
      <div
        className={cssBlock}
        onMouseOver={() => this.setState({ hover: true })}
        onMouseOut={() => this.setState({ hover: false })}
      >
        { nickname(protocol.name) }
        <div className={tooltipClass}>
          <h4>{protocol.name}</h4>
          <dl>
            <dt className={`${detailsClass}__prop`}>File</dt>
            <dd className={`${detailsClass}__val`}>{protocol.filename}</dd>
            <dt className={`${detailsClass}__prop`}>Version</dt>
            <dd className={`${detailsClass}__val`}>{protocol.version}</dd>
            <dt className={`${detailsClass}__prop`}>Network Canvas Version</dt>
            <dd className={`${detailsClass}__val`}>{protocol.networkCanvasVersion}</dd>
            <dt className={`${detailsClass}__prop`}>Updated</dt>
            <dd className={`${detailsClass}__val`}>{protocol.updatedAt && protocol.updatedAt.toLocaleString()}</dd>
          </dl>
        </div>
      </div>
    );
  }
}

ProtocolThumbnail.propTypes = {
  protocol: Types.protocol.isRequired,
};

export default ProtocolThumbnail;
