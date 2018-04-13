/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import FileDropTarget from './FileDropTarget';
import AdminApiClient from '../utils/adminApiClient';

const DeviceList = ({ devices }) => (
  <ol>
    {devices.map(d => <li key={d._id}>ID: {d._id}</li>)}
  </ol>
);

DeviceList.propTypes = {
  devices: PropTypes.array.isRequired,
};

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.apiClient = new AdminApiClient();
    this.state = { devices: [] };
  }

  componentDidMount() {
    this.getDevices();
  }

  getDevices() {
    this.apiClient.get('/devices')
      .then(resp => resp.devices)
      .then(devices => this.setState(devices ? { devices } : {}));
  }

  render() {
    const devices = this.state.devices;
    return (
      <div>
        <h1>Settings</h1>
        <h2>Paired Devices</h2>
        <DeviceList devices={devices} />
        <h2>Saved Protocols</h2>
        <FileDropTarget />
      </div>
    );
  }
}

export default SettingsScreen;
