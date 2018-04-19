import React, { Component } from 'react';

import AdminApiClient from '../utils/adminApiClient';
import DeviceList from '../components/DeviceList';
import Overflow from '../components/Overflow';
import { BarChart, CountsWidget, InterviewWidget, LineChart, PieChart, ServerPanel } from '../components';
import { countsData, interviewData, barData, pieData, lineData } from './dummy_data';

const viewModelMapper = deviceJson => ({
  ...deviceJson,
  createdAt: new Date(deviceJson.createdAt),
  updatedAt: new Date(deviceJson.updatedAt),
});

class OverviewScreen extends Component {
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
      .then(devices => devices.map(viewModelMapper))
      .then(devices => this.setState(devices ? { devices } : {}));
  }

  render() {
    const devices = this.state.devices;
    return (
      <div className="overview-dashboard">
        <ServerPanel className="overview-dashboard__panel overview-dashboard__panel--server-stats" />
        <div className="overview-dashboard__panel">
          <h2>Paired Devices</h2>
          <Overflow>
            <DeviceList devices={devices} />
          </Overflow>
        </div>
        <div className="overview-dashboard__panel"><CountsWidget data={countsData} /></div>
        <div className="overview-dashboard__panel"><InterviewWidget data={interviewData} /></div>
        <div className="overview-dashboard__panel"><BarChart data={barData} /></div>
        <div className="overview-dashboard__panel"><PieChart data={pieData} /></div>
        <div className="overview-dashboard__panel"><LineChart data={lineData} /></div>
      </div>
    );
  }
}

export default OverviewScreen;
