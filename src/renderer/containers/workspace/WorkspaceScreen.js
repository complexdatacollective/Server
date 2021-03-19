import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { arrayMove } from 'react-sortable-hoc';
import { Spinner } from '@codaco/ui';
import Types from '../../types';
import InterviewStatsPanel from './InterviewStatsPanel';
import ProtocolCardPanel from './ProtocolCardPanel';
import ProtocolCountsPanel from './ProtocolCountsPanel';
import EntityTimeSeriesPanel from './EntityTimeSeriesPanel';
import withAnswerDistributionCharts from './withAnswerDistributionCharts';
import withSessions from './withSessions';
import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import {
  actionCreators as layoutActionCreators,
  selectors as layoutSelectors,
} from '../../ducks/modules/panelLayoutOrders';
import {
  AnswerDistributionPanel,
  SessionHistoryPanel,
  SessionPanel,
  SortablePanels,
} from '../../components';
import WelcomePanel from './WelcomePanel';

class WorkspaceScreen extends Component {
  /**
   * Child components are defined here so that we can manage the sort order dynamically.
   * @return {Array} panel components to be rendered. Not sorted.
   */
  get panels() {
    const { answerDistributionCharts, protocol } = this.props;

    if (!protocol) {
      return [];
    }

    // session-related props are provided by `withSessions`
    const {
      deleteAllSessions, deleteSession, sessions, totalSessionsCount,
    } = this.props;
    return [
      <ProtocolCardPanel
        key="ProtocolCardPanel"
        protocol={protocol}
      />,
      <ProtocolCountsPanel
        key="ProtocolCountsPanel"
        protocolId={protocol.id}
        updatedAt={protocol.updatedAt}
        sessionCount={totalSessionsCount}
      />,
      <InterviewStatsPanel
        key="InterviewStatsPanel"
        protocolId={protocol.id}
        sessionCount={totalSessionsCount}
      />,
      <SessionPanel
        key="SessionPanel"
        sessions={sessions}
        totalCount={totalSessionsCount}
        deleteAllSessions={() => deleteAllSessions()}
        deleteSession={(sessionId) => deleteSession(sessionId)}
      />,
      <SessionHistoryPanel
        key="SessionHistoryPanel"
        sessions={sessions}
      />,
      <EntityTimeSeriesPanel
        key="EntityTimeSeriesPanel"
        protocolId={protocol.id}
        sessionCount={totalSessionsCount}
      />,
      ...answerDistributionCharts.map((chart) => (
        <AnswerDistributionPanel
          key={`AnswerDistributionPanel-${chart.variableType}-${chart.entityType}-${chart.variableDefinition.name}`}
          entityKey={chart.entityKey}
          entityType={chart.entityType}
          chartData={chart.chartData}
          variableDefinition={chart.variableDefinition}
        />
      )),
    ];
  }

  /**
   * If a user sorts panels by dragging, the order of component keys is persisted in redux state
   * under `panelLayoutOrder`. Because included charts may change, the defined order may not
   * include all component keys, and may include keys that no longer correspond to rendered panels.
   *
   * @return {Array} panels sorted by key as specified by the user. Any additional panels
   *                        (e.g., ones added after sort order was defined) are appended.
   */
  get sortedPanels() {
    const { panelLayoutOrder } = this.props;
    if (!panelLayoutOrder.length) {
      return this.panels;
    }

    const unsorted = [];
    const sorted = this.panels.reduce((acc, panel) => {
      const index = panelLayoutOrder.indexOf(panel.key);
      if (index >= 0) {
        acc[index] = panel;
      } else {
        unsorted.push(panel);
      }
      return acc;
    }, []);
    return sorted.filter(Boolean).concat(unsorted);
  }

  render() {
    const {
      protocol, sessions, setPanelLayoutOrder, scrollContainerRef,
    } = this.props;

    if (!protocol || !sessions) {
      return <div className="workspace--loading"><Spinner /></div>;
    }

    const { sortedPanels } = this;
    const sortedPanelKeys = sortedPanels.map((panel) => panel.key);
    const onSortEnd = ({ oldIndex, newIndex }) => {
      if (oldIndex !== newIndex) {
        setPanelLayoutOrder(protocol.id, arrayMove(sortedPanelKeys, oldIndex, newIndex));
      }
    };

    return (
      <div className="content workspace" ref={this.myRef}>
        <h1>Overview</h1>
        <WelcomePanel protocolName={protocol.name} />
        <SortablePanels
          getContainer={() => scrollContainerRef.current}
          className="dashboard"
          helperClass="sortable--dragging"
          panels={sortedPanels}
          axis="xy"
          onSortEnd={onSortEnd}
          useDragHandle
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  protocol: protocolSelectors.currentProtocol(state, ownProps),
  panelLayoutOrder: layoutSelectors.panelLayoutOrderForCurrentProtocol(state, ownProps),
});

const mapDispatchToProps = (dispatch) => ({
  setPanelLayoutOrder: bindActionCreators(layoutActionCreators.setPanelLayoutOrder, dispatch),
});

WorkspaceScreen.defaultProps = {
  answerDistributionCharts: [],
  protocol: null,
  panelLayoutOrder: [],
  sessions: null,
  totalSessionsCount: null,
  deleteSession: null,
  deleteAllSessions: null,
  scrollContainerRef: {},
};

WorkspaceScreen.propTypes = {
  answerDistributionCharts: PropTypes.array,
  protocol: Types.protocol,
  panelLayoutOrder: PropTypes.array,
  setPanelLayoutOrder: PropTypes.func.isRequired,
  deleteAllSessions: PropTypes.func,
  deleteSession: PropTypes.func,
  sessions: PropTypes.array,
  totalSessionsCount: PropTypes.number,
  scrollContainerRef: PropTypes.object,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

// withSessions & withAnswerDistributionCharts provide shared data for child components.
// withSessions is at the top level, as it provides the totalSessionsCount which other containers
// (including withAnswerDistributionCharts) use to drive updates. i.e., if a session is created or
// deleted, all charts should re-render.
const DataReadyWorkspaceScreen = withSessions(withAnswerDistributionCharts(WorkspaceScreen));

export default connect(mapStateToProps, mapDispatchToProps)(DataReadyWorkspaceScreen);

export { WorkspaceScreen as UnconnectedWorkspaceScreen };
