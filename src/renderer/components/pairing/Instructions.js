import React from 'react';

import Types from '../../types';
import { Icon } from '../../ui/components';
import DeviceStatus from '../../containers/DeviceStatus';

const Instructions = ({ devices }) => (
  <div className="pairing-instructions">
    {
      devices.length &&
      <div className="pairing-instructions__device-status">
        <DeviceStatus dark />
      </div>
    }

    <h1>Get Started with Server</h1>
    <hr />

    <section className="pairing-instructions__section">
      <h2>Import a protocol:</h2>
      <p>
        Import a <code>.netcanvas</code> protocol file by dragging it to the sidebar,
        using the <code>+</code> button, or selecting <code>Import Protocol...</code> from
        the <code>File</code> menu.
      </p>
    </section>

    {
      devices.length &&
      <section className="pairing-instructions__section">
        <h2>Devices:</h2>
        <p>View your paired devices from the button in the upper-right corner.</p>
      </section>
    }

    {
      !devices.length &&
      <section className="pairing-instructions__section">
        <h2>Pair a device:</h2>
        <ol className="pairing-instructions__steps">
          <li className="pairing-instructions__step">
            Keep this screen open
          </li>
          <li className="pairing-instructions__step">
            Open the Network Canvas app on a tablet or computer
          </li>
          <li className="pairing-instructions__step">
            Tap the <Icon name="add-a-screen" className="pairing-instructions__add-icon" />
            button on the setup screen
          </li>
        </ol>
      </section>
    }
  </div>
);

Instructions.defaultProps = {
  devices: [],
};

Instructions.propTypes = {
  devices: Types.devices,
};

export default Instructions;
