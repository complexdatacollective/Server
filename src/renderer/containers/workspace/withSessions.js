import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { ipcRenderer } from 'electron';

import Types from '../../types';
import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

/**
 * HOC to provide session-related data and functionality to a workspace.
 *
 * Defines the following props on a wrapped component:
 *
 * - deleteAllSessions
 * - deleteSession
 * - sessions
 * - totalSessionsCount
 */
const withSessions = WrappedComponent =>
  class extends Component {
    static propTypes = {
      protocol: Types.protocol,
    };

    static defaultProps = {
      protocol: null,
    };

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
      this.apiClient = new AdminApiClient();
      this.state = {
        sessions: [],
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

    onSessionsImported = () => this.loadSessions();

    get sessionsEndpoint() {
      const id = this.props.protocol.id;
      return id && `/protocols/${id}/sessions`;
    }

    sessionEndpoint(sessionId) {
      const base = this.sessionsEndpoint;
      return base && `${base}/${sessionId}`;
    }

    loadSessions() {
      const { protocol } = this.props;
      if (!protocol || this.loadPromise) {
        return;
      }
      this.loadPromise = this.apiClient.get(this.sessionsEndpoint)
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

    deleteAllSessions = () => {
      this.apiClient.delete(this.sessionsEndpoint)
        .then(() => this.loadSessions());
    }

    deleteSession = (sessionId) => {
      this.apiClient.delete(this.sessionEndpoint(sessionId))
        .then(() => this.loadSessions());
    }

    render() {
      const { sessions, totalSessionsCount } = this.state;
      return (
        <WrappedComponent
          {...this.props}
          sessions={sessions}
          totalSessionsCount={totalSessionsCount}
          deleteAllSessions={this.deleteAllSessions}
          deleteSession={this.deleteSession}
        />
      );
    }
  };

const providedPropTypes = {
  deleteAllSessions: PropTypes.function,
  deleteSession: PropTypes.function,
  sessions: PropTypes.array,
  totalSessionsCount: PropTypes.number,
};

export default withSessions;

export {
  providedPropTypes,
};
