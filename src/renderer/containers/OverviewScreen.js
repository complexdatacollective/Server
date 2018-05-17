import React from 'react';

import { BarChart, CountsWidget, InterviewWidget, LineChart, PieChart, ServerPanel } from '../components';
import { countsData, interviewData, barData, pieData, lineData } from './dummy_data';

const OverviewScreen = () => (
  <div className="overview-dashboard">
    <ServerPanel className="overview-dashboard__panel overview-dashboard__panel--server-stats" />
    <div className="overview-dashboard__panel"><CountsWidget data={countsData} /></div>
    <div className="overview-dashboard__panel"><InterviewWidget data={interviewData} /></div>
    <div className="overview-dashboard__panel"><BarChart data={barData} /></div>
    <div className="overview-dashboard__panel"><PieChart data={pieData} /></div>
    <div className="overview-dashboard__panel"><LineChart data={lineData} /></div>
  </div>
);

export default OverviewScreen;
