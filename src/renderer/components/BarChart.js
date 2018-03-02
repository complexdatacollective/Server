import React from 'react';
import PropTypes from 'prop-types';
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

// 99% width to work around recharts problem with resizing

const BarChart = ({ className, data }) => (
  <ResponsiveContainer height="100%" width="99%">
    <RechartBarChart
      data={data}
      barGap={0}
      barCategoryGap={0}
      className={className}
    >
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip labelStyle={{ color: colorDictionary['graph-tooltip'] }} />
      <Legend />
      <Bar dataKey="pv" fill={colorDictionary['graph-data-1']} />
    </RechartBarChart>
  </ResponsiveContainer>
);

BarChart.defaultProps = {
  className: '',
};

BarChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
};

export default BarChart;
