import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';

import Types from '../types';
import ProtocolCountsPanel from './ProtocolCountsPanel';
import withApiClient from '../components/withApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';
import { Spinner } from '../ui';
import { selectors } from '../ducks/modules/protocols';
import {
  DummyDashboardFragment,
  ProtocolPanel,
  ServerPanel,
  SessionHistoryPanel,
  SessionPanel,
} from '../components';

class WorkspaceScreen extends Component {
  static getDerivedStateFromProps(props, state) {
    if (props.protocol && props.protocol.id !== state.prevProtocolId) {
      // Protocol has changed; reset data to trigger new load
      return {
        prevProtocolId: props.protocol.id,
        sessions: null,
        totalSessionsCount: null,
      };
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = {
      sessions: null,
      totalSessionsCount: null,
    };
  }

  componentDidMount() {
    this.loadSessions();
    ipcRenderer.on('SESSIONS_IMPORTED', this.onSessionsImported);
  }

  componentDidUpdate() {
    if (!this.state.sessions) {
      this.loadSessions();
    }
  }

  componentWillUnmount() {
    if (this.loadPromise) { this.loadPromise.cancelled = true; }
    ipcRenderer.removeListener('SESSIONS_IMPORTED', this.onSessionsImported);
  }

  onSessionsImported = () => this.loadSessions()

  get sessionsEndpoint() {
    const id = this.props.protocol.id;
    return id && `/protocols/${id}/sessions`;
  }

  sessionEndpoint(sessionId) {
    const base = this.sessionsEndpoint;
    return base && `${base}/${sessionId}`;
  }

  loadSessions() {
    const { apiClient, protocol } = this.props;
    if (!protocol || !apiClient || this.loadPromise) {
      return;
    }
    this.loadPromise = apiClient.get(this.sessionsEndpoint)
      .then((resp) => {
        if (!this.loadPromise.cancelled) {
          const sessions = resp.sessions.map(viewModelMapper);
          this.setState({ sessions, totalSessionsCount: resp.totalSessions });
        }
      })
      .catch((err) => {
        if (!this.loadPromise.cancelled) {
          logger.error(err);
          this.setState({ sessions: [] });
        }
      })
      .then(() => { this.loadPromise = null; });
  }

  deleteAllSessions() {
    this.props.apiClient.delete(this.sessionsEndpoint)
      .then(() => this.loadSessions());
  }

  deleteSession(sessionId) {
    const { apiClient } = this.props;
    apiClient.delete(this.sessionEndpoint(sessionId))
      .then(() => this.loadSessions());
    // TODO: catch / error msg
  }

  render() {
    const { protocol } = this.props;
    const { sessions, totalSessionsCount } = this.state;
    if (!protocol || !sessions) {
      return <div className="workspace--loading"><Spinner /></div>;
    }
    return (
      <div className="workspace">
        <div className="dashboard">
          <ServerPanel className="dashboard__panel dashboard__panel--server-stats" />
          <ProtocolPanel protocol={protocol} />
          <ProtocolCountsPanel
            key={`protocol-counts-${protocol.id}`}
            protocolId={protocol.id}
            updatedAt={protocol.updatedAt}
            sessionCount={totalSessionsCount}
          />
          <SessionPanel
            sessions={sessions}
            totalCount={totalSessionsCount}
            deleteAllSessions={() => this.deleteAllSessions()}
            deleteSession={sessionId => this.deleteSession(sessionId)}
          />
          {
            sessions && <SessionHistoryPanel sessions={sessions} />
          }
          <DummyDashboardFragment key={`dummy-${protocol.id}`} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  protocol: selectors.currentProtocol(state, ownProps),
});

WorkspaceScreen.defaultProps = {
  protocol: null,
};

WorkspaceScreen.propTypes = {
  apiClient: PropTypes.object.isRequired,
  protocol: Types.protocol,
};

export default connect(mapStateToProps)(withApiClient(WorkspaceScreen));

export { WorkspaceScreen as UnconnectedWorkspaceScreen };
