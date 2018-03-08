import React from 'react';
import PropTypes from 'prop-types';
import { PieChart as RechartPieChart, Pie, Cell, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const COLORS = [
  colorDictionary['graph-data-1'],
  colorDictionary['graph-data-2'],
  colorDictionary['graph-data-3'],
  colorDictionary['graph-data-4'],
];

// 99% width to work around recharts problem with resizing

const PieChart = ({ className, data }) => (
  <ResponsiveContainer height="100%" width="99%">
    <RechartPieChart
      className={className}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Legend />
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        outerRadius={100}
      >
        {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
      </Pie>
    </RechartPieChart>
  </ResponsiveContainer>
);

PieChart.defaultProps = {
  className: '',
};

PieChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
};

export default PieChart;
