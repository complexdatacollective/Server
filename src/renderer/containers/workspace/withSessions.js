import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { pull } from 'lodash';

import Types from '../../types';
import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

/**
 * HOC to provide session-related data and functionality to a workspace.
 *
 * Defines the following props on a wrapped component:
 *
 * - deleteAllSessions
 * - deleteSelectedSessions
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
          sessionOffset: 0,
        };
      }
      return null;
    }

    constructor(props) {
      super(props);
      this.apiClient = new AdminApiClient();
      this.loadPromises = [];
      this.state = {
        sessions: [],
        totalSessionsCount: null,
        sessionOffset: 0,
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
      this.loadPromises.map(loadPromise => ({ ...loadPromise, cancelled: true }));
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

    loadSessions = (startIndex = 0, stopIndex = 5, sortType = 'createdAt', direction = -1, filterValue = '') => {
      const { protocol } = this.props;
      if (!protocol) {
        return;
      }
      const loadPromise = this.apiClient.get(`${this.sessionsEndpoint}/${startIndex}/${stopIndex}/${sortType}/${direction}/${filterValue}`);
      this.loadPromises.push(loadPromise);
      loadPromise
        .then((resp) => {
          if (!loadPromise.cancelled) {
            let sessions = !!startIndex && this.state.sessions ? this.state.sessions : [];
            sessions = [...sessions, ...resp.sessions.map(viewModelMapper)];
            this.setState({
              sessions,
              totalSessionsCount: resp.totalSessions,
              sessionOffset: sessions.length,
            // eslint-disable-next-line no-return-assign
            });
          }
        })
        .catch((err) => {
          if (!loadPromise.cancelled) {
            logger.error(err);
            this.setState({ sessions: [] });
          }
        })
        .then(() => { pull(this.loadPromises, loadPromise); });
    }

    hasMoreSessions = () => this.state.sessionOffset < this.state.totalSessionsCount;

    loadMoreSessions = (startIndex, stopIndex, sortType, direction, filterValue) => {
      this.loadSessions(startIndex, stopIndex, sortType, direction, filterValue);
    }

    reloadSessions = (sortType, direction, filterValue) => {
      this.loadSessions(0, this.state.sessions.length, sortType, direction, filterValue);
    }

    deleteAllSessions = () => {
      this.apiClient.delete(this.sessionsEndpoint)
        .then(() => this.loadSessions());
    }

    deleteSelectedSessions = (selectedSessions) => {
      if (!selectedSessions) return;
      const deletePromises = selectedSessions.map(
        session => this.apiClient.delete(this.sessionEndpoint(session)));
      Promise.all(deletePromises)
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
          deleteSelectedSessions={this.deleteSelectedSessions}
          deleteSession={this.deleteSession}
          hasMoreSessions={this.hasMoreSessions}
          loadMoreSessions={this.loadMoreSessions}
          reloadSessions={this.reloadSessions}
        />
      );
    }
  };

const providedPropTypes = {
  deleteAllSessions: PropTypes.function,
  deleteSelectedSessions: PropTypes.function,
  deleteSession: PropTypes.function,
  sessions: PropTypes.array,
  totalSessionsCount: PropTypes.number,
  hasMoreSessions: PropTypes.function,
  loadMoreSessions: PropTypes.function,
  reloadSessions: PropTypes.function,
};

export default withSessions;

export {
  providedPropTypes,
};
