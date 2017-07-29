import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'A', value: 40, other: 22 },
    { name: 'B', value: 75, other: 43 },
    { name: 'C', value: 32, other: 45 },
    { name: 'D', value: 20, other: 67 },
    { name: 'E', value: 100, other: 56 },
    { name: 'F', value: 5, other: 75 },
    { name: 'G', value: 15, other: 89 }];

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
      stroke="#0fb2e2"
    />
    <Line
      dataKey="other"
      name="Second set"
      stroke="#00c9a2"
    />
    <XAxis dataKey="name" />
    <YAxis />
    <CartesianGrid strokeDasharray="3 3" />
    <Legend />
    <Tooltip labelStyle={{ color: '#e82d3f' }} />
  </LineChart>
);

export default LineChartWrapper;
