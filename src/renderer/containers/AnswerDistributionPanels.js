import React, { Component } from 'react';
import PropTypes from 'prop-types';

import withApiClient from '../components/withApiClient';
import AnswerDistributionPanel from '../components/AnswerDistributionPanel';
import Types from '../types';

/**
 * Renders a collection of ordinal & categorical distribution panels
 */
class AnswerDistributionPanels extends Component {
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
        const data = buckets[entityType] && buckets[entityType][variableDefinition.name];
        if (data && Object.keys(data).length) {
          // Provide data for every ordinal option, even if one has no data
          this.setState({
            chartData: variableDefinition.options.map(({ label, value = '' }) => ({
              name: label,
              value: data[value.toString()] || 0,
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
    const panelProps = { chartData, variableType, variableDefinition };
    // TODO: render one per variable
    return (
      <AnswerDistributionPanel {...panelProps} />
    );
  }
}

AnswerDistributionPanels.defaultProps = {
  apiClient: null,
  entityName: 'node',
  entityType: null,
  sessionCount: null,
};

AnswerDistributionPanels.propTypes = {
  apiClient: PropTypes.object,
  entityName: Types.entityName,
  entityType: PropTypes.string,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
};

export default withApiClient(AnswerDistributionPanels);
