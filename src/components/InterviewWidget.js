import React from 'react';
import { CountsWidget } from '.';

const data = [
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

const InterviewWidget = () => (
  <div className="interview">
    {data.map((entry, index) => (
      <div key={index}>
        <h4 className="interview__label">{entry.name}</h4>
        <CountsWidget className="interview__data" data={entry.data} />
      </div>))}
  </div>
);

export default InterviewWidget;
