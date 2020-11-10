import React from 'react';
import PropTypes from 'prop-types';
import PairingInstructions from './PairingInstructions';

const Instructions = ({
  compact,
  networkStatus,
  showPairingInstructions,
  showImportInstructions,
  showImportSessionInstructions,
}) => (
  <div className={`instructions instructions--inline ${compact ? 'instructions--compact' : ''}`}>
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
        <PairingInstructions networkStatus={networkStatus} />
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
  networkStatus: null,
  showPairingInstructions: true,
  showImportInstructions: true,
  showImportSessionInstructions: true,
};

Instructions.propTypes = {
  compact: PropTypes.bool,
  networkStatus: PropTypes.object,
  showPairingInstructions: PropTypes.bool,
  showImportInstructions: PropTypes.bool,
  showImportSessionInstructions: PropTypes.bool,
};

export default Instructions;
