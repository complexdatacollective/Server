import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CountsWidget from '../components/charts/CountsWidget';
import withApiClient from '../components/withApiClient';

const shapeCountData = (nodeCount, edgeCount, sessionCount) => ([
  { name: 'Node count', count: nodeCount },
  { name: 'Edge count', count: edgeCount },
  { name: 'Interview count', count: sessionCount },
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
    if (this.props.sessionCount !== prevProps.sessionCount) {
      this.loadData();
    }
  }

  loadData() {
    const route = `/protocols/${this.props.protocolId}/reports/total_counts`;
    this.props.apiClient.get(route)
      .then(({ counts: { nodes, edges, sessions } }) => this.setState({
        countsData: shapeCountData(nodes, edges, sessions),
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
  protocolId: null,
  sessionCount: 0,
};

ProtocolCountsPanel.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string,
  sessionCount: PropTypes.number,
};

export default withApiClient(ProtocolCountsPanel);

export {
  ProtocolCountsPanel as UnconnectedProtocolCountsPanel,
};
