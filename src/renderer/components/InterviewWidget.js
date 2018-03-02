import React from 'react';
import PropTypes from 'prop-types';
import { CountsWidget } from '.';

const InterviewWidget = ({ className, data }) => (
  <div className={`interview-widget ${className}`}>
    {data.map((entry, index) => (
      <div key={index}>
        <h4 className="interview-widget__label">{entry.name}</h4>
        <CountsWidget className="interview-widget__data" data={entry.data} />
      </div>))}
  </div>
);

InterviewWidget.defaultProps = {
  className: '',
};

InterviewWidget.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
};

export default InterviewWidget;
