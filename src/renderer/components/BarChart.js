import React from 'react';
import PropTypes from 'prop-types';
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const BarChart = ({ data }) => (
  <RechartBarChart
    width={600}
    height={300}
    data={data}
    barGap={0}
    barCategoryGap={0}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
  >
    <XAxis dataKey="name" />
    <YAxis />
    <CartesianGrid strokeDasharray="3 3" />
    <Tooltip labelStyle={{ color: colorDictionary['graph-tooltip'] }} />
    <Legend />
    <Bar dataKey="pv" fill={colorDictionary['graph-data-1']} />
  </RechartBarChart>
);

BarChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default BarChart;
