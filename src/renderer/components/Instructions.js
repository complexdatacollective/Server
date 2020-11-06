import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@codaco/ui';
import Types from '../types';
import { ExternalLink } from './ExternalLink';

const Instructions = ({
  compact, apiInfo, showPairingInstructions, showImportInstructions, showImportSessionInstructions,
}) => (
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
            Tap the Server pairing button on the device’s setup screen
          </li>
        </ol>
        {
          apiInfo &&
          <section className="instructions__subsection">
            <Icon name="info" />
            <div>
              <p>
                If this Server is not automatically discovered by your device,
                you may enter the connection information manually, using the
                details at the top of this screen.
              </p>
              <p>
                Please see our <ExternalLink href="https://documentation.networkcanvas.com">documentation</ExternalLink> for further information on pairing and networking setup.
              </p>
            </div>
          </section>
        }

      </section>
    }

    {
      showImportSessionInstructions &&
      <section className="instructions__section">
        <h2>To import a case:</h2>
        <p>
          Once you have a protocol imported, you can import a <code>.graphml</code> case file by
          dragging it to the protocol overview section, or
          selecting <code>Import Interview Files...</code> from the <code>File</code> menu.
        </p>
      </section>
    }
  </div>
);

Instructions.defaultProps = {
  compact: false,
  apiInfo: null,
  showPairingInstructions: true,
  showImportInstructions: true,
  showImportSessionInstructions: true,
};

Instructions.propTypes = {
  compact: PropTypes.bool,
  apiInfo: Types.deviceApiInfo,
  showPairingInstructions: PropTypes.bool,
  showImportInstructions: PropTypes.bool,
  showImportSessionInstructions: PropTypes.bool,
};

export default Instructions;
