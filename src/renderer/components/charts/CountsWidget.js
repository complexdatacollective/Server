import React from 'react';
import PropTypes from 'prop-types';

const CountsWidget = ({ className, data }) => (
  <div className={`counts-widget ${className}`}>
    {data.map((entry, index) => (
      <div key={index} className="counts-widget__content">
        <h4>{entry.name}: </h4>
        <h1>{entry.count}</h1>
      </div>))}
  </div>
);

CountsWidget.defaultProps = {
  className: '',
};

CountsWidget.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
};

export default CountsWidget;
