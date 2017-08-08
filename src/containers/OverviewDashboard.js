import React from 'react';
import { BarChart, CountsWidget, InterviewWidget, LineChart, PieChart } from '../components';

const data = [
      { name: 'Node count', count: 423 },
      { name: 'Edge count', count: 256 },
      { name: 'Interview count', count: 56 },
];

const OverviewDashboard = () => (
  <div className="overview-dashboard">
    <CountsWidget data={data} />
    <InterviewWidget />
    <BarChart />
    <PieChart />
    <LineChart />
  </div>
);

export default OverviewDashboard;
