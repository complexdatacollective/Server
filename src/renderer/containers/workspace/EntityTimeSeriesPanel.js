import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { EmptyData, TimeSeriesChart } from '../../components';
import withApiClient from '../../components/withApiClient';

// Data series are keyed with node_[subtype] and edge_[subtype]; we can assume subtypes are
// meaningfully unique and label with just the subtype
const subtypeLabel = subtype => ({ key: subtype, label: `${subtype.split('_')[1]}` });

// Based on the API response, determine which series to render.
// If there's only one node subtype (e.g., 'person'), don't render it.
const dataSeries = (timeSeriesKeys = []) => {
  const series = [];
  const nodeSubtypes = timeSeriesKeys.filter(key => (/node_/).test(key));
  const edgeSubtypes = timeSeriesKeys.filter(key => (/edge_/).test(key));
  if (timeSeriesKeys.includes('node')) {
    series.push({ key: 'node', label: 'node' });
  }
  if (nodeSubtypes.length > 1) {
    series.push(...nodeSubtypes.map(subtypeLabel));
  }
  if (timeSeriesKeys.includes('edge')) {
    series.push({ key: 'edge', label: 'edge' });
  }
  if (edgeSubtypes.length > 1) {
    series.push(...edgeSubtypes.map(subtypeLabel));
  }
  return series;
};

/**
 * Render a line chart with each entity type as a series
 */
class EntityTimeSeriesPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      timeSeriesData: [],
      timeSeriesKeys: [],
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
      .then(({ entities, keys }) => entities && this.setState({
        timeSeriesData: entities,
        timeSeriesKeys: keys,
      }));
  }

  render() {
    const { timeSeriesData, timeSeriesKeys } = this.state;
    let content;
    if (timeSeriesData.length > 0) {
      const series = dataSeries(timeSeriesKeys);
      content = <TimeSeriesChart data={this.state.timeSeriesData} series={series} />;
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
