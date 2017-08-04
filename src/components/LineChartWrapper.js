import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

// days with no data are represented with null values
const data = [
    { time: new Date(2017, 6, 24).toLocaleDateString(), value: 40, other: 22 },
    { time: new Date(2017, 6, 25).toLocaleDateString() },
    { time: new Date(2017, 6, 26).toLocaleDateString(), value: 75, other: 43 },
    { time: new Date(2017, 6, 27).toLocaleDateString(), value: 32, other: 45 },
    { time: new Date(2017, 6, 28).toLocaleDateString(), value: 20, other: 67 },
    { time: new Date(2017, 6, 29).toLocaleDateString() },
    { time: new Date(2017, 6, 30).toLocaleDateString(), value: 100, other: 56 },
    { time: new Date(2017, 7, 1).toLocaleDateString(), value: 5, other: 75 },
    { time: new Date(2017, 7, 2).toLocaleDateString(), other: 61 },
    { time: new Date(2017, 7, 3).toLocaleDateString(), value: 15, other: 89 }];

const LineChartWrapper = () => (
  <LineChart
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
  </LineChart>
);

export default LineChartWrapper;
