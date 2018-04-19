import React, { Component } from 'react';
import { ipcRenderer } from 'electron';

import AdminApiClient from '../utils/adminApiClient';

// TODO: Channels are shared with main. Support shared build target.
const ApiConnectionInfoChannel = 'API_INFO';
const RequestApiConnectionInfoChannel = 'REQUEST_API_INFO';

function withApiClient(WrappedComponent) {
  // TODO: API port may change in face of crash/restart.
  class ApiClientComponent extends Component {
    constructor(props) {
      super(props);
      this.state = { apiClient: null };
      ipcRenderer.send(RequestApiConnectionInfoChannel);
      ipcRenderer.once(ApiConnectionInfoChannel, (event, apiInfo) => {
        this.setState({ apiClient: new AdminApiClient(apiInfo.port) });
      });
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

const IPC = {
  ApiConnectionInfoChannel,
  RequestApiConnectionInfoChannel,
};

export {
  IPC,
};
