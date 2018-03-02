import React from 'react';
import { Button, Icon } from 'network-canvas-ui/lib/components';

export default () => (
  <div className="pairing-prompt">
    <Icon name="info" className="pairing-prompt__icon" />
    <div className="pairing-prompt__content">
      <h1>Pair Device?</h1>
      <p>
        A device is attempting to pair with this computer.
        This will give it access to your interview protocols and allow it to upload data.
      </p>
      <div className="pairing-prompt__buttonGroup">
        <Button color="platinum" size="small">
          Dismiss
        </Button>
        &nbsp;
        <Button size="small">
          Pair With Device
        </Button>
      </div>
    </div>
    <div className="pairing-prompt__close">
      <Icon name="close" />
    </div>
  </div>
);
