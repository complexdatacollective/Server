import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { EmptyData, TimeSeriesChart } from '../components';
import withApiClient from '../components/withApiClient';

class EntityTimeSeriesPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeSeriesData: [],
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
    const route = `/protocols/${this.props.protocolId}/reports/entity_time_series`;
    this.props.apiClient.get(route)
      .then(({ entities }) => entities && this.setState({
        timeSeriesData: entities,
      }));
  }

  render() {
    // For now, just render node & edge counts
    const dataKeys = ['node', 'edge'];
    const { timeSeriesData } = this.state;
    let content;
    if (timeSeriesData.length > 0) {
      content = <TimeSeriesChart data={this.state.timeSeriesData} dataKeys={dataKeys} />;
    } else {
      content = <EmptyData />;
    }
    return (
      <div className="dashboard__panel dashboard__panel--chart">
        <h4 className="dashboard__header-text">
          Imported network sizes
        </h4>
        <div className="dashboard__chartContainer">
          {content}
        </div>
      </div>
    );
  }
}

EntityTimeSeriesPanel.defaultProps = {
  apiClient: null,
  sessionCount: null,
};

EntityTimeSeriesPanel.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
};

export default withApiClient(EntityTimeSeriesPanel);

export {
  EntityTimeSeriesPanel as UnconnectedEntityTimeSeriesPanel,
};
