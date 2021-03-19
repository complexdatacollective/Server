import React from 'react';
import PropTypes from 'prop-types';
import { CloseButton } from '@codaco/ui';
import { ExternalLink } from '../../components';
import useDismissibleState from '../../hooks/useDismissibleState';

const WelcomePanel = ({
  protocolName,
}) => {
  const [dismissedWelcome, dismissWelcome] = useDismissibleState('dismissedWelcome');

  if (dismissedWelcome.includes(protocolName)) {
    return null;
  }

  return (
    <div className="welcome-panel">
      <div className="welcome-panel__content">
        <div className="welcome-content__text">
          <h1>Your protocol workspace</h1>
          <p>
            You are currently viewing the overview screen for this workspace. It is
            designed to give you an &apos;at a glance&apos; summary of the data you have
            collected so far. Below you will see summary charts for each variable, which
            will populate as soon as data is available. Try dragging the charts to
            rearrange them (you can also hide or show charts from the settings tab).
          </p>
          <p>
            Use the tabs in this workspace to switch between managing cases, exporting data,
            or accessing settings.
          </p>
          <p>
            To import data into Server, either use the menu item (
            <code>
              File -&gt; Import Interview
              Files
            </code>
            ), drag and drop files into this workspace, or upload sessions directly
            from a device running Interviewer. Click the &apos;Network Status&apos; icon at the top
            of the screen for instructions for pairing.
          </p>
          <p>
            To learn more about using Server, please visit our
            {' '}
            <ExternalLink href="https://documentation.networkcanvas.com">documentation website</ExternalLink>
            .
          </p>
        </div>
        <div className="welcome-content__image" />
      </div>
      <CloseButton className="overlay__close" onClick={() => dismissWelcome(protocolName)} />
    </div>
  );
};

WelcomePanel.propTypes = {
  protocolName: PropTypes.string.isRequired,
};

export default WelcomePanel;
