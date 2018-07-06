import React, { Component } from 'react';

import AdminApiClient from '../utils/adminApiClient';

function withApiClient(WrappedComponent) {
  class ApiClientComponent extends Component {
    constructor(props) {
      super(props);
      this.state = { apiClient: new AdminApiClient() };
    }

    render() {
      return (
        <WrappedComponent {...this.props} apiClient={this.state.apiClient} />
      );
    }
  }

  return ApiClientComponent;
}

export default withApiClient;
