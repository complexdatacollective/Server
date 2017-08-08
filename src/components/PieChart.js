import React from 'react';
import { PieChart as RechartPieChart, Pie, Cell, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const data = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
    { name: 'Group E', value: 100 },
    { name: 'Group F', value: 50 },
    { name: 'Group G', value: 150 }];
const COLORS = [
  colorDictionary['graph-data-1'],
  colorDictionary['graph-data-2'],
  colorDictionary['graph-data-3'],
  colorDictionary['graph-data-4'],
];


const PieChart = () => (
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

export default PieChart;
