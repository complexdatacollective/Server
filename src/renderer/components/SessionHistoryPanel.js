import React from 'react';
import PropTypes from 'prop-types';

import BarChart from './charts/BarChart';
import EmptyData from './charts/EmptyData';

const buildChartContent = (sessions) => {
  if (!sessions.length) {
    return <EmptyData />;
  }

  const dataLabel = 'Interviews';
  const countsByDay = {};

  // Group by date & format for bar chart:
  // [{ updatedAt: Date('2018-x-x'), _id: '' }, ...]
  // => { '2018-x-x': n, ... }
  // => [{ name: '2018-x-x', Interviews: n }, ...],

  sessions.forEach((session) => {
    const dateStr = new Date(session.updatedAt.getTime()).toDateString();
    countsByDay[dateStr] = countsByDay[dateStr] || 0;
    countsByDay[dateStr] += 1;
  });

  const barData = Object.entries(countsByDay)
    .map(([dateStr, count]) => ({ name: dateStr, [dataLabel]: count }))
    .reverse();

  return <BarChart allowDecimals={false} data={barData} dataKeys={[dataLabel]} />;
};

/**
 * Displays a bar chart of session counts, grouped by day
 */
const SessionHistoryPanel = ({ sessions }) => (
  <div className="dashboard__panel dashboard__panel--chart">
    <h4 className="dashboard__header-text">Interviews by import date</h4>
    <div className="dashboard__chartContainer">
      { buildChartContent(sessions) }
    </div>
  </div>
);

SessionHistoryPanel.propTypes = {
  sessions: PropTypes.array.isRequired,
};

export default SessionHistoryPanel;
