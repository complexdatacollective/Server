import React, { Component } from 'react';
import PropTypes from 'prop-types';

import withApiClient from '../components/withApiClient';
import Types from '../types';
import { BarChart, EmptyData, PieChart } from '../components';

const chartComponent = variableType => ((variableType === 'categorical') ? PieChart : BarChart);

const headerLabel = variableType => ((variableType === 'categorical') ? 'Categorical' : 'Ordinal');

/**
 * Depending on variableType, renders either a pie chart with a distribution of categorical
 * node attributes, or a Bar chart with a distribution of ordinal attributes.
 */
class AnswerDistributionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: [],
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    const prevCount = prevProps.sessionCount;
    const newCount = this.props.sessionCount;
    // When mounted (on each workspace load), sessionCount is null.
    // Only reload data when session count changes (i.e., a session was
    // imported or deleted while on this workspace).
    if (newCount !== null && prevCount !== null && newCount !== prevCount) {
      this.loadData();
    }
  }

  loadData() {
    const { entityName, entityType, variableDefinition } = this.props;
    const route = `/protocols/${this.props.protocolId}/reports/option_buckets`;
    const query = { variableName: variableDefinition.name };
    if (entityName && entityType) {
      query.entityName = entityName;
      query.entityType = entityType;
    }
    this.props.apiClient.get(route, query)
      .then(({ buckets }) => {
        if (Object.keys(buckets).length) {
          // Provide data for every ordinal option, even if one has no data
          this.setState({
            chartData: variableDefinition.options.map(({ label, value = '' }) => ({
              name: label,
              value: buckets[value.toString()] || 0,
            })),
          });
        } else {
          this.setState({ chartData: [] });
        }
      });
  }

  render() {
    const { chartData } = this.state;
    const { variableType, variableDefinition } = this.props;
    const Chart = chartComponent(variableType);
    const header = headerLabel(variableType);
    let content;
    if (chartData.length) {
      content = <Chart allowDecimals={false} data={chartData} dataKeys={['value']} />;
    } else {
      content = <EmptyData />;
    }
    return (
      <div className="dashboard__panel dashboard__panel--chart">
        <h4 className="dashboard__header-text">
          {header} distribution: {variableDefinition.label}
        </h4>
        <div className="dashboard__chartContainer">
          {content}
        </div>
      </div>
    );
  }
}

AnswerDistributionPanel.defaultProps = {
  apiClient: null,
  entityName: 'node',
  entityType: null,
  sessionCount: null,
};

AnswerDistributionPanel.propTypes = {
  apiClient: PropTypes.object,
  entityName: Types.entityName,
  entityType: PropTypes.string,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
  variableDefinition: Types.variableDefinition.isRequired,
  variableType: PropTypes.oneOf(['categorical', 'ordinal']).isRequired,
};

export default withApiClient(AnswerDistributionPanel);
