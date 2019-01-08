import React from 'react';
import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getCSSValue, getCSSValueRange } from '../../utils/CSSVariables';
import { formatDatetime } from '../../utils/formatters';

const colors = getCSSValueRange('--graph-data-', 1, 15);
const tooltipColor = getCSSValue('--graph-tooltip');

const timeFormatter = timestamp => formatDatetime(new Date(timestamp));

// 99% width to work around recharts problem with resizing
const TimeSeriesChart = ({ className, data, dataKeys }) => (
  <ResponsiveContainer height="100%" width="99%">
    <LineChart
      data={data}
      className={className}
    >
      {
        dataKeys &&
        dataKeys.map((dataKey, i) => (
          <Line
            key={dataKey}
            dataKey={dataKey}
            name={dataKey}
            stroke={colors[(i % colors.length)]}
            connectNulls
          />
        ))
      }
      <XAxis
        scale="time"
        type="number"
        domain={['dataMin', 'dataMax']}
        dataKey="time"
        interval="preserveStart"
        tickFormatter={timeFormatter}
      />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Legend />
      <Tooltip
        labelFormatter={timeFormatter}
        labelStyle={{ color: tooltipColor }}
      />
    </LineChart>
  </ResponsiveContainer>
);

TimeSeriesChart.defaultProps = {
  className: '',
};

TimeSeriesChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
  dataKeys: PropTypes.array.isRequired,
};

export default TimeSeriesChart;
