import React from 'react';
import PropTypes from 'prop-types';

import { BarChart, TimeSeriesChart, PieChart } from '../components';
import { barData, pieData, lineData } from '../utils/dummy_data';

const DummyDashboardFragment = ({ className }) => (
  <React.Fragment>
    <div className={`${className}__panel ${className}__panel-mock`}><BarChart data={barData} dataKeys={['pv', 'uv']} /></div>
    <div className={`${className}__panel ${className}__panel-mock`}><PieChart data={pieData} /></div>
    <div className={`${className}__panel ${className}__panel-mock`}>
      <TimeSeriesChart data={lineData} dataKeys={['value', 'other']} />
    </div>
  </React.Fragment>
);

DummyDashboardFragment.defaultProps = {
  className: 'dashboard',
};

DummyDashboardFragment.propTypes = {
  className: PropTypes.string,
};

export default DummyDashboardFragment;
