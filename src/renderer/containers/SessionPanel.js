import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { ipcRenderer } from 'electron';

import withApiClient from '../components/withApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';

import { DismissButton, ScrollingPanelItem } from '../components';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class SessionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      stale: false,
      sessions: [],
      totalCount: 0,
    };
  }

  componentDidMount() {
    this.loadSessions();
    ipcRenderer.on('SESSIONS_IMPORTED', this.onSessionsImported);
  }

  componentDidUpdate(prevProps) {
    const newProtocol = this.props.protocolId && this.props.protocolId !== prevProps.protocolId;
    const newClient = this.props.apiClient && this.props.apiClient !== prevProps.apiClient;
    if (newProtocol || newClient || this.state.stale) {
      this.loadSessions();
    }
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('SESSIONS_IMPORTED', this.onSessionsImported);
  }

  onSessionsImported = () => this.loadSessions()

  get sessionsEndpoint() {
    const id = this.props.protocolId;
    return id && `/protocols/${id}/sessions`;
  }

  get header() {
    const { sessions, totalCount } = this.state;
    const countText = (totalCount && sessions.length < totalCount) ? `(${sessions.length} of ${totalCount})` : '';
    return (
      <div className="session-panel__header">
        <h4 className="session-panel__header-text">
          Imported Sessions
          <small className="session-panel__header-count">
            {countText}
          </small>
        </h4>
        {
          sessions.length > 0 &&
          <DismissButton small inline onClick={() => this.deleteAllSessions()}>
            Delete all
          </DismissButton>
        }
      </div>
    );
  }

  sessionEndpoint(sessionId) {
    const base = this.sessionsEndpoint;
    return base && `${base}/${sessionId}`;
  }

  loadSessions() {
    const { apiClient, protocolId } = this.props;
    if (!protocolId || !apiClient) {
      return;
    }
    this.setState({ isLoading: true, stale: false });
    apiClient.get(this.sessionsEndpoint)
      .then((resp) => {
        const sessions = resp.sessions.map(viewModelMapper);
        this.setState({ isLoading: false, sessions, totalCount: resp.totalSessions });
      })
      .catch((err) => {
        logger.error(err);
        this.setState({ sessions: [] });
      });
  }

  deleteAllSessions() {
    const { apiClient, protocolId } = this.props;
    if (!protocolId || !apiClient) {
      return;
    }
    if (confirm('Delete all sessions for this protocol?')) { // eslint-disable-line no-alert
      apiClient.delete(this.sessionsEndpoint)
        .then(() => this.setState({ stale: true }));
      // TODO: catch / error msg
    }
  }

  deleteSession(sessionId) {
    const { apiClient, protocolId } = this.props;
    if (!sessionId || !protocolId || !apiClient) {
      return;
    }
    if (confirm('Delete this session?')) { // eslint-disable-line no-alert
      apiClient.delete(this.sessionEndpoint(sessionId))
        .then(() => this.setState({ stale: true }));
      // TODO: catch / error msg
    }
  }

  render() {
    const { isLoading, sessions } = this.state;

    return (
      <ScrollingPanelItem header={this.header}>
        { (sessions.length === 0) && !isLoading && emptyContent }
        <ul className="session-panel__list">
          {!isLoading && sessions.map(s => (
            <li key={s.id}>
              <p>
                <DismissButton small inline onClick={() => this.deleteSession(s.id)} />
                {s.id}
              </p>
            </li>
          ))}
        </ul>
      </ScrollingPanelItem>
    );
  }
}

SessionPanel.defaultProps = {
  apiClient: null,
  protocolId: null,
};

SessionPanel.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string,
};

export default withApiClient(SessionPanel);

export {
  SessionPanel as UnwrappedSessionPanel,
};
