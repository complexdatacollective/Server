import React from 'react';
import { PieChart, Pie, Cell, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
    { name: 'Group E', value: 100 },
    { name: 'Group F', value: 50 },
    { name: 'Group G', value: 150 }];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


const PieChartWrapper = () => (
  <PieChart
    width={600}
    height={300}
    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    data={data}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <Tooltip />
    <Legend />
    <Pie
      data={data}
      nameKey="name"
      outerRadius={100}
    >
      {data.map((entry, index) => <Cell fill={COLORS[index % COLORS.length]} />)}
    </Pie>
  </PieChart>
);

export default PieChartWrapper;