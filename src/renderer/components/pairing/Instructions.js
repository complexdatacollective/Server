import React from 'react';

import { Icon } from '../../ui/components';

const Instructions = () => (
  <div className="pairing-instructions">
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
  </div>
);

export default Instructions;
