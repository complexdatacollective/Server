import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';

import Types from '../types';
import ProtocolCountsPanel from './ProtocolCountsPanel';
import withApiClient from '../components/withApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';
import { DummyDashboardFragment, ProtocolPanel, ServerPanel, SessionPanel } from '../components';
import { Spinner } from '../ui';
import { selectors } from '../ducks/modules/protocols';

class WorkspaceScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.loadSessions();
    ipcRenderer.on('SESSIONS_IMPORTED', this.onSessionsImported);
  }

  componentDidUpdate(prevProps) {
    if (this.props.protocol !== prevProps.protocol) {
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
    if (!protocol) {
      return <div className="workspace--loading"><Spinner /></div>;
    }
    return (
      <div className="workspace">
        <div className="dashboard">
          <ServerPanel className="dashboard__panel dashboard__panel--server-stats" />
          <ProtocolPanel protocol={protocol} />
          <SessionPanel
            sessions={sessions}
            totalCount={totalSessionsCount}
            deleteAllSessions={() => this.deleteAllSessions()}
            deleteSession={sessionId => this.deleteSession(sessionId)}
          />
          <ProtocolCountsPanel
            protocolId={protocol.id}
            updatedAt={protocol.updatedAt}
            sessionCount={totalSessionsCount}
          />
          <DummyDashboardFragment key={protocol.id} />
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
