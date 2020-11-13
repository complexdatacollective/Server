import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import { EmptyData, TimeSeriesChart } from '../../components';
import withApiClient from '../../components/withApiClient';

const { currentCodebook } = protocolSelectors;

// Data series are keyed with node_[subtype] and edge_[subtype]; we can assume subtypes are
// meaningfully unique and label with just the subtype
const subtypeLabel = subtype => subtype.split('_')[1];
const codebookSubtypeLabel = (codebook, entityType, subtype) => (
  (codebook && codebook[entityType][subtypeLabel(subtype)] &&
    codebook[entityType][subtypeLabel(subtype)].name) || subtypeLabel(subtype)
);

// Based on the API response, determine which series to render.
// If there's only one node subtype (e.g., 'person'), don't render it.
const dataSeries = (timeSeriesKeys = [], codebook) => {
  const series = [];
  const nodeSubtypes = timeSeriesKeys.filter(key => (/node_/).test(key));
  const edgeSubtypes = timeSeriesKeys.filter(key => (/edge_/).test(key));
  if (timeSeriesKeys.includes('node')) {
    series.push({ key: 'node', label: 'node' });
  }
  if (nodeSubtypes.length > 1) {
    series.push(...nodeSubtypes.map(subtype =>
      ({ key: subtype, label: codebookSubtypeLabel(codebook, 'node', subtype) })));
  }
  if (timeSeriesKeys.includes('edge')) {
    series.push({ key: 'edge', label: 'edge' });
  }
  if (edgeSubtypes.length > 1) {
    series.push(...edgeSubtypes.map(subtype =>
      ({ key: subtype, label: codebookSubtypeLabel(codebook, 'edge', subtype) })));
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
    const { codebook } = this.props;
    let content;
    if (timeSeriesData.length > 0) {
      const series = dataSeries(timeSeriesKeys, codebook);
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
  codebook: {},
};

EntityTimeSeriesPanel.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
  codebook: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
  codebook: currentCodebook(state, ownProps),
});

const UnconnectedEntityTimeSeriesPanel = (withApiClient(EntityTimeSeriesPanel));

export default connect(mapStateToProps)(withApiClient(EntityTimeSeriesPanel));

export {
  UnconnectedEntityTimeSeriesPanel,
};
