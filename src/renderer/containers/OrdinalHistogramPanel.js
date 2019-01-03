import React, { Component } from 'react';
import PropTypes from 'prop-types';

import BarChart from '../components/charts/BarChart';
import withApiClient from '../components/withApiClient';
import Types from '../types';

class OrdinalHistogramPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      barData: [],
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
    const route = `/protocols/${this.props.protocolId}/reports/ordinalBuckets`;
    const query = { variableName: variableDefinition.name };
    if (entityName && entityType) {
      query.entityName = entityName;
      query.entityType = entityType;
    }
    this.props.apiClient.get(route, query)
      .then(({ buckets }) => buckets && this.setState({
        barData: variableDefinition.options.map(({ label, value }) => ({
          name: label,
          value: buckets[value.toString()] || 0,
        })),
      }));
  }

  render() {
    return (
      <div className="dashboard__panel">
        <h4>Answer distribution: {this.props.variableDefinition.label}</h4>
        <BarChart data={this.state.barData} dataKeys={['value']} />
      </div>
    );
  }
}

OrdinalHistogramPanel.defaultProps = {
  apiClient: null,
  entityName: 'node',
  entityType: null,
  sessionCount: null,
};

OrdinalHistogramPanel.propTypes = {
  apiClient: PropTypes.object,
  entityName: Types.entityName,
  entityType: PropTypes.string,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
  variableDefinition: Types.variableDefinition.isRequired,
};

export default withApiClient(OrdinalHistogramPanel);

export {
  OrdinalHistogramPanel as UnconnectedOrdinalHistogramPanel,
};
