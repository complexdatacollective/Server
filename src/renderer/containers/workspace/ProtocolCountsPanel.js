import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import CountsWidget from '../../components/charts/CountsWidget';
import withApiClient from '../../components/withApiClient';

const shapeCountData = (nodeCount, edgeCount, sessionCount) => ([
  { name: 'Total Interviews', count: sessionCount },
  { name: 'Total Nodes', count: nodeCount },
  { name: 'Total Edges', count: edgeCount },
]);

class ProtocolCountsPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      countsData: shapeCountData(null, null, props.sessionCount),
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    const { sessionCount: newCount } = this.props;
    const prevCount = prevProps.sessionCount;
    // When mounted (on each workspace load), sessionCount is null.
    // Only reload data when session count changes (i.e., a session was
    // imported or deleted while on this workspace).
    if (newCount !== null && prevCount !== null && newCount !== prevCount) {
      this.loadData();
    }
  }

  loadData() {
    const { protocolId, apiClient } = this.props;
    const route = `/protocols/${protocolId}/reports/total_counts`;
    apiClient.get(route)
      .then(({ counts }) => counts && this.setState({
        countsData: shapeCountData(counts.nodes, counts.edges, counts.sessions),
      }));
  }

  render() {
    const { countsData } = this.state;
    return (
      <div className="dashboard__panel">
        <h4>Total Counts</h4>
        <CountsWidget data={countsData} />
      </div>
    );
  }
}

ProtocolCountsPanel.defaultProps = {
  apiClient: null,
  sessionCount: null,
};

ProtocolCountsPanel.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string.isRequired,
  sessionCount: PropTypes.number,
};

export default withApiClient(ProtocolCountsPanel);

export {
  ProtocolCountsPanel as UnconnectedProtocolCountsPanel,
};
