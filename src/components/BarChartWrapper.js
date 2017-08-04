import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { colorDictionary } from 'network-canvas-ui';

const data = [
      { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
      { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
      { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
      { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
      { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
      { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
      { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const BarChartWrapper = () => (
  <BarChart
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
  </BarChart>
);

export default BarChartWrapper;
