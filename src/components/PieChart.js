import React from 'react';
import PropTypes from 'prop-types';
import { PieChart as RechartPieChart, Pie, Cell, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const COLORS = [
  colorDictionary['graph-data-1'],
  colorDictionary['graph-data-2'],
  colorDictionary['graph-data-3'],
  colorDictionary['graph-data-4'],
];

const PieChart = ({ data }) => (
  <RechartPieChart
    width={600}
    height={300}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
);

PieChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default PieChart;
