import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Modal, PairPin } from '../components';

/* eslint-disable */
class PairDevice extends Component {
  constructor(props) {
    super(props);
    this.state = { open: true };
  }

  onClose() {
    this.setState({open: false});
  };

  render () {
    const { pairingCode } = this.props;
    return pairingCode && (
      <Modal show={this.state.open} title="Pair a Device" close={() => this.onClose()}>
        <PairPin code={pairingCode} />
      </Modal>
    );
  }
}

PairDevice.propTypes = {
  pairingCode: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  pairingCode: state.pairing && state.pairing.pairingCode,
});

export default connect(mapStateToProps)(PairDevice);
export {
  PairDevice,
};
