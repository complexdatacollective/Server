import React, { Component } from 'react';

import { Modal, PairPin } from '../components';

/* eslint-disable */
class PairDevice extends Component {
  constructor(props) {
    super(props);
    this.state = { open: true };
  }

  onClose(history, location, match) {
    this.setState({open: false});
  };

  render () {
    const {history, location, match} = this.props;
    return (
      <Modal show={this.state.open} title="Pair a Device" close={() => this.onClose(history, location, match)}>
        <PairPin code="xxxx" />
      </Modal>
    );
  }
}

export default PairDevice;
