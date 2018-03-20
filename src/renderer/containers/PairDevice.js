import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { Modal, PairPin } from '../components';

const PairDevice = ({ pairingRequest, dismissPairingRequest }) => {
  if (pairingRequest.status === PairingStatus.Complete) {
    return (
      <Modal show title="All Set!" onComplete={dismissPairingRequest}>
        <p>
          Your device is now paired with this installation of Server.
          You can now access interview protocols stored on Server and upload data from the field.
        </p>
      </Modal>
    );
  }

  if (pairingRequest.status === PairingStatus.Acknowledged) {
    return (
      <Modal show title="Pair a Device" onCancel={dismissPairingRequest}>
        <PairPin code={pairingRequest.pairingCode} />
      </Modal>
    );
  }

  return null;
};

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
  PairDevice,
};
