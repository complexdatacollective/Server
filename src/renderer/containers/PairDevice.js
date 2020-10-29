import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Modal } from '@codaco/ui';
import withApiClient from '../components/withApiClient';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';
import { PairPin } from '../components';

const DefaultExpiredCheckInterval = 1000;

class PairDevice extends Component {
  componentDidUpdate() {
    if (!this.timer &&
        this.props.pairingRequest.status === PairingStatus.Acknowledged) {
      const { apiClient, dismissPairingRequest, showErrorMessage, pairingRequest } = this.props;
      const doCheck = () => {
        apiClient.checkPairingCodeExpired(pairingRequest.id)
          .then(({ isExpired, expiresAt }) => {
            if (isExpired) {
              dismissPairingRequest();
              showErrorMessage('Pairing timed out');
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

    if (this.props.pairingRequest.status === PairingStatus.Complete) {
      this.props.showConfirmationMessage('Your device is now paired with this installation of Server. You can access interview protocols stored on Server and upload data securely from this device.');
      this.props.dismissPairingRequest();
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
          show={(pairingRequest.status === PairingStatus.Acknowledged)}
          title="Pair a Device"
          unmountOnExit
        >
          <React.Fragment>
            <PairPin
              code={pairingRequest.pairingCode}
              dismissPairingRequest={dismissPairingRequest}
            />
          </React.Fragment>
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
  showErrorMessage: PropTypes.func.isRequired,
  showConfirmationMessage: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
  showErrorMessage: bindActionCreators(messageActionCreators.showErrorMessage, dispatch),
  showConfirmationMessage:
    bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
});

const mapStateToProps = ({ pairingRequest }) => ({
  pairingRequest,
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withApiClient,
)(PairDevice);

export {
  PairDevice as UnconnectedPairDevice,
};
