import React from 'react';
import PropTypes from 'prop-types';

const CountsWidget = ({ data }) => (
  <div className="counts-widget">
    {data.map((entry, index) => (
      <div key={index} className="counts-widget__content">
        <h4>{entry.name}: </h4>
        <h1>{entry.count}</h1>
      </div>))}
  </div>
);

CountsWidget.propTypes = {
  data: PropTypes.array.isRequired,
};

export default CountsWidget;
