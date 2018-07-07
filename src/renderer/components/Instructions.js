import React from 'react';
import PropTypes from 'prop-types';

import { Icon } from '../ui/components';

const Instructions = ({ compact, showPairingInstructions, showProtocolInstructions }) => (
  <div className={`instructions ${compact ? 'instructions--compact' : ''}`}>
    {
      showProtocolInstructions &&
      <section className="instructions__section">
        <h2>Import a protocol:</h2>
        <p>
          Import a <code>.netcanvas</code> protocol file by dragging it to the sidebar,
          using the <code>+</code> button, or selecting <code>Import Protocol...</code> from
          the <code>File</code> menu.
        </p>
      </section>
    }

    {
      !showPairingInstructions &&
      <section className="instructions__section">
        <h2>Devices:</h2>
        <p>View your paired devices from the button in the upper-right corner.</p>
      </section>
    }

    {
      showPairingInstructions &&
      <section className="instructions__section">
        <h2>To pair a device:</h2>
        <ol className="instructions__steps">
          <li className="instructions__step">
            Keep this window open
          </li>
          <li className="instructions__step">
            Open the Network Canvas app on a tablet or computer
          </li>
          <li className="instructions__step">
            Tap the <Icon name="add-a-screen" className="instructions__add-icon" />
            button on the device’s setup screen
          </li>
        </ol>
      </section>
    }
  </div>
);

Instructions.defaultProps = {
  compact: false,
  showPairingInstructions: true,
  showProtocolInstructions: true,
};

Instructions.propTypes = {
  compact: PropTypes.bool,
  showPairingInstructions: PropTypes.bool,
  showProtocolInstructions: PropTypes.bool,
};

export default Instructions;
