import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CountsWidget from '../components/charts/CountsWidget';
import withApiClient from '../components/withApiClient';
import { formatDecimal } from '../utils/formatters';

const shapeCountData = (nodeCount, edgeCount, sessionCount) => ([
  { name: 'Total Nodes', count: nodeCount },
  { name: 'Total Edges', count: edgeCount },
  { name: 'Total Interviews', count: sessionCount },
  { name: 'Mean Nodes / Interview', count: sessionCount && formatDecimal(nodeCount / sessionCount) },
  { name: 'Mean Edges / Interview', count: sessionCount && formatDecimal(edgeCount / sessionCount) },
]);

class ProtocolCountsPanel extends Component {
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
    const route = `/protocols/${this.props.protocolId}/reports/total_counts`;
    this.props.apiClient.get(route)
      .then(({ counts }) => counts && this.setState({
        countsData: shapeCountData(counts.nodes, counts.edges, counts.sessions),
      }));
  }

  render() {
    return (
      <div className="dashboard__panel">
        <CountsWidget data={this.state.countsData} />
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
