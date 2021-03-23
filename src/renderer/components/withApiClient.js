import React, { Component } from 'react';

import AdminApiClient from '../utils/adminApiClient';

function withApiClient(WrappedComponent) {
  class ApiClientComponent extends Component {
    constructor(props) {
      super(props);
      this.state = { apiClient: new AdminApiClient() };
    }

    render() {
      const { apiClient } = this.state;
      return (
        <WrappedComponent
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.props}
          apiClient={apiClient}
        />
      );
    }
  }

  return ApiClientComponent;
}

export default withApiClient;
