import React from 'react';
import PropTypes from 'prop-types';
import NetworkStatusTable from './NetworkStatusTable';
import { ExternalLink } from './ExternalLink';
import useNetworkStatus from '../hooks/useNetworkStatus';

const PairingInstructions = ({
  showNetworkInformation,
}) => {
  const networkStatus = useNetworkStatus();

  return (
    <div className="instructions instructions--inline">
      <h2>To pair a device:</h2>
      <ol className="instructions__steps">
        <li className="instructions__step">
          With Server open on this computer, open the Network Canvas Interviewer app on a supported
          device.
        </li>
        <li className="instructions__step">
          Scroll down the start screen to the &apos;Server Status&apos; panel.
        </li>
        { networkStatus.mdnsIsSupported && (
          <React.Fragment>
            <li className="instructions__step">
              The automatic discovery service is available on this computer, which means that this
              computer will be visible in the server discovery panel within Interviewer, providing
              both devices are connected to the same network. If this Server appears in the panel,
              tap it to begin the pairing process.
            </li>
            <li>
              If this computer does not appear in the automatic discovery panel, you can provide
              manual connection details to pair. Expand the section below to view this
              computer&apos;s IP address(es) and port.
            </li>
          </React.Fragment>
        )}
        { !networkStatus.mdnsIsSupported && (
          <li>
            The automatic discovery service is <strong>not functioning on this device</strong>, so
            you will need to provide manual connection details to your device running Interviewer.
            Consult the table below to find the IP address of this computer, along with the port.
            Enter these details into the manual connection details dialog within Interviewer.
          </li>
        )}
      </ol>
      {
        showNetworkInformation &&
        <section className="instructions__subsection">
          { networkStatus &&
            <details open={!networkStatus.mdnsIsSupported}>
              <summary>Manual Connection Details</summary>
              <br />
              <NetworkStatusTable
                networkStatus={networkStatus}
                uptime={false}
                discoverable={false}
              />
              <p>
                <strong>Tip:</strong> Use the copy button to easily copy the data below
                into your clipboard.
              </p>
            </details>
          }
        </section>
      }
      <p>
        Please see our <ExternalLink href="https://documentation.networkcanvas.com/docs/key-concepts/pairing/">documentation</ExternalLink> for further information on pairing and networking setup.
      </p>
    </div>
  );
};

PairingInstructions.defaultProps = {
  showNetworkInformation: true,
};

PairingInstructions.propTypes = {
  showNetworkInformation: PropTypes.bool,
};

export default PairingInstructions;
