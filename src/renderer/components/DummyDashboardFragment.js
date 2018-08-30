import React from 'react';
import PropTypes from 'prop-types';

import { BarChart, InterviewWidget, LineChart, PieChart } from '../components';
import { interviewData, barData, pieData, lineData } from '../utils/dummy_data';

const DummyDashboardFragment = ({ className }) => (
  <React.Fragment>
    <div className={`${className}__panel`}><InterviewWidget data={interviewData} /></div>
    <div className={`${className}__panel`}><BarChart data={barData} /></div>
    <div className={`${className}__panel`}><PieChart data={pieData} /></div>
    <div className={`${className}__panel`}><LineChart data={lineData} /></div>
  </React.Fragment>
);

DummyDashboardFragment.defaultProps = {
  className: 'dashboard',
};

DummyDashboardFragment.propTypes = {
  className: PropTypes.string,
};

export default DummyDashboardFragment;
