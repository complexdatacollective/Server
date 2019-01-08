import React from 'react';
import PropTypes from 'prop-types';

import Types from '../types';
import { BarChart, EmptyData, PieChart } from '../components';

const sumValues = groups => groups.reduce((sum, group) => sum + group.value, 0);

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
const AnswerDistributionPanel = ({ chartData, variableDefinition }) => (
  <div className="dashboard__panel dashboard__panel--chart">
    <h4 className="dashboard__header-text">
      {variableDefinition.label}
      <small className="dashboard__header-subtext">
        {headerLabel(variableDefinition.type)} distribution
      </small>
    </h4>
    <div className="dashboard__chartContainer">
      {content(chartData, variableDefinition.type)}
    </div>
    <div className="dashboard__chartFooter">
      Total: {sumValues(chartData)} observations
    </div>
  </div>
);

AnswerDistributionPanel.defaultProps = {
  chartData: [],
};

AnswerDistributionPanel.propTypes = {
  chartData: PropTypes.array,
  variableDefinition: Types.variableDefinition.isRequired,
};

export default AnswerDistributionPanel;
