import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { Modal, PairPin } from '../components';

const PairDevice = ({ pairingRequest, dismissPairingRequest }) => (
  <div>
    <Modal
      show={pairingRequest.status === PairingStatus.Complete}
      title="All Set!"
      onComplete={dismissPairingRequest}
      className="modal--pairing-confirmation"
    >
      <p>
        Your device is now paired with this installation of Server.
        You can now access interview protocols stored on Server and upload data from the field.
      </p>
    </Modal>
    <Modal
      show={(pairingRequest.status === PairingStatus.Acknowledged)}
      title="Pair a Device"
      onCancel={dismissPairingRequest}
      unmountOnExit
    >
      <PairPin code={pairingRequest.pairingCode} />
    </Modal>
  </div>
);

PairDevice.propTypes = {
  dismissPairingRequest: PropTypes.func.isRequired,
  pairingRequest: PropTypes.shape({
    pairingCode: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
};

const mapDispatchToProps = dispatch => ({
  dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
});

const mapStateToProps = ({ pairingRequest }) => ({
  pairingRequest,
});

export default connect(mapStateToProps, mapDispatchToProps)(PairDevice);
export {
  PairDevice as UnconnectedPairDevice,
};
