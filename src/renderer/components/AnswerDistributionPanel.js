import React from 'react';
import PropTypes from 'prop-types';

import Types from '../types';
import { BarChart, EmptyData, PieChart } from '../components';

const chartComponent = variableType => ((variableType === 'categorical') ? PieChart : BarChart);

const headerLabel = variableType => ((variableType === 'categorical') ? 'Categorical' : 'Ordinal');

const content = (chartData, variableType) => {
  const Chart = chartComponent(variableType);
  if (chartData.length) {
    return <Chart allowDecimals={false} data={chartData} dataKeys={['value']} />;
  }
  return <EmptyData />;
};

/**
 * Depending on variableType, renders either a pie chart with a distribution of categorical
 * node attributes, or a Bar chart with a distribution of ordinal attributes.
 */
const AnswerDistributionPanel = ({ chartData, variableType, variableDefinition }) => (
  <div className="dashboard__panel dashboard__panel--chart">
    <h4 className="dashboard__header-text">
      {variableDefinition.label}
      <small className="dashboard__header-subtext">{headerLabel(variableType)} distribution</small>
    </h4>
    <div className="dashboard__chartContainer">
      {content(chartData, variableType)}
    </div>
  </div>
);

AnswerDistributionPanel.defaultProps = {
  chartData: null,
};

AnswerDistributionPanel.propTypes = {
  chartData: PropTypes.array,
  variableType: PropTypes.oneOf(['categorical', 'ordinal']).isRequired,
  variableDefinition: Types.variableDefinition.isRequired,
};

export default AnswerDistributionPanel;
