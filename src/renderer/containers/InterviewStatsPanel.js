import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import InterviewWidget from '../components/charts/InterviewWidget';
import withApiClient from '../components/withApiClient';
import { formatDecimal } from '../utils/formatters';

const shapeStatsData = ({ nodes = {}, edges = {} }) => ([
  { name: 'Node count',
    data: [
      { name: 'Mean', count: formatDecimal(nodes.mean) },
      { name: 'Min', count: nodes.min },
      { name: 'Max', count: nodes.max },
    ],
  },
  { name: 'Edge count',
    data: [
      { name: 'Mean', count: formatDecimal(edges.mean) },
      { name: 'Min', count: edges.min },
      { name: 'Max', count: edges.max },
    ],
  },
]);

class InterviewStatsPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      statsData: shapeStatsData({}),
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
    const route = `/protocols/${this.props.protocolId}/reports/summary_stats`;
    this.props.apiClient.get(route)
      .then(({ stats }) => stats && this.setState({
        statsData: shapeStatsData(stats),
      }));
  }

  render() {
    return (
      <div className="dashboard__panel">
        <InterviewWidget data={this.state.statsData} />
      </div>
    );
  }
}

InterviewStatsPanel.defaultProps = {
  apiClient: null,
  sessionCount: null,
};

InterviewStatsPanel.propTypes = {
  apiClient: PropTypes.object,
  sessionCount: PropTypes.number,
  protocolId: PropTypes.string.isRequired,
};

export default withApiClient(InterviewStatsPanel);

export {
  InterviewStatsPanel as UnconnectedInterviewStatsPanel,
};
