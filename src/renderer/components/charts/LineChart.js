import React from 'react';
import PropTypes from 'prop-types';
import { LineChart as RechartLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { getCSSValueDict } from '../../utils/CSSVariables';

const colorDict = getCSSValueDict('--graph-data-1', '--graph-data-2', '--graph-tooltip');

// 99% width to work around recharts problem with resizing
const LineChart = ({ className, data }) => (
  <ResponsiveContainer height="100%" width="99%">
    <RechartLineChart
      data={data}
      className={className}
    >
      <Line
        dataKey="value"
        name="First set"
        stroke={colorDict['--graph-data-1']}
        connectNulls
      />
      <Line
        dataKey="other"
        name="Second set"
        stroke={colorDict['--graph-data-2']}
        connectNulls
      />
      <XAxis dataKey="time" interval="preserveStart" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Legend />
      <Tooltip labelStyle={{ color: colorDict['--graph-tooltip'] }} />
    </RechartLineChart>
  </ResponsiveContainer>
);

LineChart.defaultProps = {
  className: '',
};

LineChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
};

export default LineChart;
