import React from 'react';
import PropTypes from 'prop-types';

import Types from '../types';
import { Icon } from '../ui/components';

const Instructions = ({ compact, apiInfo, showPairingInstructions, showImportInstructions }) => (
  <div className={`instructions ${compact ? 'instructions--compact' : ''}`}>
    {
      showImportInstructions &&
      <section className="instructions__section">
        <h2>To import a protocol:</h2>
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
        {
          apiInfo &&
          <section className="instructions__subsection">
            <p>
              <em>If this Server is not automatically discovered by your device,
              you may enter the connection information manually:</em>
            </p>
            <dl className="instructions__definition-list">
              <dt>Address</dt>
              <dd>{apiInfo.address}</dd>
              <dt>Port</dt>
              <dd>{apiInfo.httpPort}</dd>
            </dl>
          </section>
        }

      </section>
    }
  </div>
);

Instructions.defaultProps = {
  compact: false,
  apiInfo: null,
  showPairingInstructions: true,
  showImportInstructions: true,
};

Instructions.propTypes = {
  compact: PropTypes.bool,
  apiInfo: Types.deviceApiInfo,
  showPairingInstructions: PropTypes.bool,
  showImportInstructions: PropTypes.bool,
};

export default Instructions;
