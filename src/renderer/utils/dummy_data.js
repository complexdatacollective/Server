const interviewData = [
  { name: 'Duration (minutes)',
    data: [{ name: 'Mean', count: 23 },
      { name: 'Min', count: 12 },
      { name: 'Max', count: 56 }] },
  { name: 'Node count',
    data: [{ name: 'Mean', count: 15 },
      { name: 'Min', count: 2 },
      { name: 'Max', count: 67 }] },
  { name: 'Edge count',
    data: [{ name: 'Mean', count: 12 },
      { name: 'Min', count: 2 },
      { name: 'Max', count: 78 }] },
];

const barData = [
  { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const pieData = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
  { name: 'Group E', value: 100 },
  { name: 'Group F', value: 50 },
  { name: 'Group G', value: 150 }];

// days with no data are represented with null values
const lineData = [
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

export {
  interviewData,
  barData,
  pieData,
  lineData,
};
