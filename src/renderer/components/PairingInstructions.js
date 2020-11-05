import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@codaco/ui';
import NetworkStatusTable from './NetworkStatusTable';

const Instructions = ({
  compact,
  networkStatus,
}) => {
  const showNetworkInformation = true; //networkStatus && networkStatus.mdnsIsSupported === 'error';

  return (
    <div className={`instructions ${compact ? 'instructions--compact' : ''}`}>
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
          showNetworkInformation &&
          <section className="instructions__subsection">
            <Icon name="info" />
            <div>
              <p>
                If this Server is not automatically discovered by your device,
                you may enter the connection information manually.
              </p>
              <NetworkStatusTable
                networkStatus={networkStatus}
                hostname={false}
                uptime={false}
                discoverable={false}
              />
              <p>
                Please see our <a href="https://documentation.networkcanvas.com" className="external-link">documentation</a> for further information on pairing and networking setup.
              </p>
            </div>
          </section>
        }

      </section>
    </div>
  );
};

Instructions.defaultProps = {
  compact: false,
  networkStatus: {},
};

Instructions.propTypes = {
  compact: PropTypes.bool,
  networkStatus: PropTypes.object,
};

export default Instructions;
