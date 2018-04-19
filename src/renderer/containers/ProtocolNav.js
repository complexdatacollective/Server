import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ProtocolThumbnails from '../components/ProtocolThumbnails';
import AdminApiClient from '../utils/adminApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';

class ProtocolNav extends Component {
  constructor(props) {
    super(props);
    this.apiClient = new AdminApiClient();
    this.state = { protocols: [] };
  }

  componentDidMount() {
    this.getProtocols();
  }

  getProtocols() {
    this.apiClient.get('/protocols')
      .then(resp => resp.protocols)
      .then((protocols = []) => protocols.map(viewModelMapper))
      .then(protocols => this.setState({ protocols }));
  }

  render() {
    return (
      <nav className={this.props.className}>
        <ProtocolThumbnails className={this.props.className} protocols={this.state.protocols} />
      </nav>
    );
  }
}

ProtocolNav.defaultProps = {
  className: '',
};

ProtocolNav.propTypes = {
  className: PropTypes.string,
};

export default ProtocolNav;
