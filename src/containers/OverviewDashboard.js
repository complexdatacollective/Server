import React from 'react';
import { BarChartWrapper, CountsWidget, InterviewWidget, LineChartWrapper, PieChartWrapper } from '../components';

const data = [
      { name: 'Node count', count: 423 },
      { name: 'Edge count', count: 256 },
      { name: 'Interview count', count: 56 },
];

const OverviewDashboard = () => (
  <div className="dashboard">
    <CountsWidget data={data} />
    <InterviewWidget />
    <BarChartWrapper />
    <PieChartWrapper />
    <LineChartWrapper />
  </div>
);

export default OverviewDashboard;
