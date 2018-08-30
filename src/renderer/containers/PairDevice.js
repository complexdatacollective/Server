import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import withApiClient from '../components/withApiClient';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';
import { Modal, PairPin } from '../components';

const DefaultExpiredCheckInterval = 1000;

class PairDevice extends Component {
  componentDidUpdate() {
    if (!this.timer &&
        this.props.pairingRequest.status === PairingStatus.Acknowledged) {
      const { apiClient, dismissPairingRequest, showMessage, pairingRequest } = this.props;
      const doCheck = () => {
        apiClient.checkPairingCodeExpired(pairingRequest.id)
          .then(({ isExpired, expiresAt }) => {
            if (isExpired) {
              dismissPairingRequest();
              showMessage('Pairing timed out');
              this.timer = null;
            } else {
              let expiresIn = new Date(expiresAt) - new Date();
              if (isNaN(expiresIn) || expiresIn < DefaultExpiredCheckInterval) {
                expiresIn = DefaultExpiredCheckInterval;
              }
              this.timer = setTimeout(doCheck, expiresIn);
            }
          });
      };
      this.timer = setTimeout(doCheck, DefaultExpiredCheckInterval);
    }

    if (this.timer && this.props.pairingRequest.status !== PairingStatus.Acknowledged) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const { pairingRequest, dismissPairingRequest } = this.props;
    return (
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
  }
}

PairDevice.propTypes = {
  apiClient: PropTypes.object.isRequired,
  dismissPairingRequest: PropTypes.func.isRequired,
  pairingRequest: PropTypes.shape({
    id: PropTypes.string,
    pairingCode: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  showMessage: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
  showMessage: bindActionCreators(messageActionCreators.showMessage, dispatch),
});

const mapStateToProps = ({ pairingRequest }) => ({
  pairingRequest,
});

export default connect(mapStateToProps, mapDispatchToProps)(withApiClient(PairDevice));

export {
  PairDevice as UnconnectedPairDevice,
};
