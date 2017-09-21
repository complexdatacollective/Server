import React from 'react';
import PropTypes from 'prop-types';
import { CountsWidget } from '.';

const InterviewWidget = ({ data }) => (
  <div className="interview-widget">
    {data.map((entry, index) => (
      <div key={index}>
        <h4 className="interview-widget__label">{entry.name}</h4>
        <CountsWidget className="interview-widget__data" data={entry.data} />
      </div>))}
  </div>
);

InterviewWidget.propTypes = {
  data: PropTypes.array.isRequired,
};

export default InterviewWidget;
