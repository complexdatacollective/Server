import React from 'react';
import PropTypes from 'prop-types';

import { formatNumber } from '../../utils/formatters';

const CountsWidget = ({ className, data }) => (
  <div className={`counts-widget ${className}`}>
    {data.map((entry, index) => (
      <div key={index} className="counts-widget__content">
        <p className="counts-widget__key">{entry.name}: </p>
        <p className="counts-widget__value">{formatNumber(entry.count)}</p>
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
