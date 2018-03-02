import React from 'react';
import { OverviewDashboard } from '.';
import { Header } from '../components';

const OverviewScreen = () => (
  <div className="screen">
    <Header />
    <main className="screen__main">
      <OverviewDashboard />
    </main>
  </div>
);

export default OverviewScreen;
