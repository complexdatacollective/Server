
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button } from '@codaco/ui';
import ReactTooltip from 'react-tooltip';
import Types from '../types';
import { actionCreators } from '../ducks/modules/devices';
import { selectors } from '../ducks/modules/pairingRequest';
import Overlay from '../components/Overlay';
import PairingInstructions from '../components/PairingInstructions';
import DeviceList from '../components/DeviceList';
import useNetworkStatus from '../hooks/useNetworkStatus';

const DeviceStatus = ({
  devices,
  hasPendingRequest,
  loadDevices,
}) => {
  const networkStatus = useNetworkStatus();
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (!showDevicesModal) { setShowInstructions(false); }
  }, [showDevicesModal]);

  useEffect(() => {
    if (hasPendingRequest) {
      setShowDevicesModal(false);
      setShowInstructions(false);
    }
  }, [hasPendingRequest]);

  useEffect(() => {
    loadDevices();
    ReactTooltip.rebuild();
  }, [hasPendingRequest]);

  return [
    <div
      data-tip="Manage paired devices"
      data-for="device-status-tooltip"
      className="device-status"
      data-test="view-device-panel"
      onClick={() => setShowDevicesModal(true)}
      key="button"
      role="button"
      tabIndex={0}
    >
      <div className="device-status__icon">
        <span className="device-status__badge">{devices ? devices.length : '0'}</span>
      </div>
      {hasPendingRequest }
    </div>,
    <Overlay
      show={showDevicesModal && !showInstructions}
      onClose={() => setShowDevicesModal(false)}
      title="Paired Devices"
      className="device-status__overlay"
      key="devices"
    >
      <p>Devices that have been paired with Server are listed below.</p>
      <DeviceList devices={devices} />
      <div className="device-status__overlay-controls">
        <Button
          color="platinum"
          data-test="view-pairing-instructions"
          onClick={() => setShowInstructions(true)}
        >
          View pairing instructions
        </Button>
      </div>
    </Overlay>,
    <Overlay
      show={showDevicesModal && showInstructions}
      onClose={() => { setShowDevicesModal(false); setShowInstructions(false); }}
      title="Pairing Instructions"
      className="device-status__overlay"
      key="instructions"
    >
      <PairingInstructions
        networkStatus={networkStatus}
      />

      <div className="device-status__overlay-controls">
        <Button color="platinum" onClick={() => setShowInstructions(false)}>
          View paired devices
        </Button>
        <Button
          onClick={() => setShowDevicesModal(false)}
        >
          Close
        </Button>
      </div>
    </Overlay>,
    <ReactTooltip
      key="device-status-tooltip"
      id="device-status-tooltip"
      delayShow={300}
      place="bottom"
      effect="solid"
    />,
  ];
};

DeviceStatus.defaultProps = {
  devices: [],
  deleteDevice: null,
  hasPendingRequest: false,
  loadDevices: () => {},
};

DeviceStatus.propTypes = {
  devices: Types.devices,
  loadDevices: PropTypes.func,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  devices: state.devices,
  hasPendingRequest: selectors.requestIsPending(state),
});

const mapDispatchToProps = {
  loadDevices: actionCreators.loadDevices,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(DeviceStatus);

export {
  DeviceStatus as UnconnectedDeviceStatus,
};
