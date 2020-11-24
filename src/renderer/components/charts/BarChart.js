import React from 'react';
import PropTypes from 'prop-types';
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { getCSSValueDict, getCSSValues } from '../../utils/CSSVariables';

const colorDict = getCSSValueDict('--graph-tooltip');
const barColors = getCSSValues(
  '--graph-data-1',
  '--graph-data-2',
  '--graph-data-3',
  '--graph-data-4',
);

// 99% width to work around recharts problem with resizing
const BarChart = ({ className, data, dataKeys, allowDecimals }) => (
  <ResponsiveContainer height="100%" width="99%" debounce={300}>
    <RechartBarChart
      data={data}
      barGap={0}
      barCategoryGap={0}
      maxBarSize={50}
      className={className}
    >
      <XAxis dataKey="name" />
      <YAxis allowDecimals={allowDecimals} />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip labelStyle={{ color: colorDict['--graph-tooltip'] }} />
      {
        dataKeys.length > 1 ? <Legend /> : null
      }
      {
        dataKeys.map((dataKey, i) => (
          <Bar key={dataKey} dataKey={dataKey} fill={barColors[i % barColors.length]} />
        ))
      }
    </RechartBarChart>
  </ResponsiveContainer>
);

BarChart.defaultProps = {
  allowDecimals: true,
  className: '',
};

BarChart.propTypes = {
  allowDecimals: PropTypes.bool,
  className: PropTypes.string,
  data: PropTypes.array.isRequired,
  dataKeys: PropTypes.array.isRequired,
};

export default BarChart;
