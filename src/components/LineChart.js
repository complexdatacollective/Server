import React from 'react';
import PropTypes from 'prop-types';
import { LineChart as RechartLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const LineChart = ({ data }) => (
  <RechartLineChart
    width={600}
    height={300}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    data={data}
  >
    <Line
      dataKey="value"
      name="First set"
      stroke={colorDictionary['graph-data-1']}
      connectNulls
    />
    <Line
      dataKey="other"
      name="Second set"
      stroke={colorDictionary['graph-data-2']}
      connectNulls
    />
    <XAxis dataKey="time" interval="preserveStart" />
    <YAxis />
    <CartesianGrid strokeDasharray="3 3" />
    <Legend />
    <Tooltip labelStyle={{ color: colorDictionary['graph-tooltip'] }} />
  </RechartLineChart>
);

LineChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default LineChart;
