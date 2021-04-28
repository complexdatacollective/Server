/* eslint-disable react/static-property-placement */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { debounce, pull } from 'lodash';
import ipcChannels from '../../utils/ipcChannels';
import Types from '../../types';
import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

const defaultMinimumSessions = 100;

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
const withSessions = (WrappedComponent) => class extends Component {
  static propTypes = {
    protocol: Types.protocol,
  };

  static defaultProps = {
    protocol: null,
  };

  static getDerivedStateFromProps(props, state) {
    const {
      protocol,
    } = props;

    if (protocol && protocol.id !== state.prevProtocolId) {
      // Protocol has changed; reset data to trigger new load
      return {
        prevProtocolId: protocol.id,
        sessions: null,
        totalSessionsCount: null,
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
      filterValue: '',
      sortType: 'createdAt',
      sortDirection: -1,
    };
  }

  componentDidMount() {
    this.loadSessions();
    // Listen for protocol data changes
    ipcRenderer.on(ipcChannels.DATA_IS_STALE, this.onSessionsImported);
  }

  componentDidUpdate() {
    const { sessions } = this.state;
    if (!sessions) {
      this.loadSessions();
    }
  }

  componentWillUnmount() {
    this.loadPromises = this.loadPromises.map(
      (loadPromise) => ({ ...loadPromise, cancelled: true }),
    );
    ipcRenderer.removeListener(ipcChannels.DATA_IS_STALE, this.onSessionsImported);
  }

    onSessionsImported = () => this.reloadSessions();

    get sessionsEndpoint() {
      const { protocol } = this.props;
      const { id } = protocol;
      return id && `/protocols/${id}/sessions`;
    }

    changeFilter = (event) => {
      this.setState({
        filterValue: event.target.value,
      }, this.debouncedReload());
    }

    sortSessions = (newSortType) => {
      const { sortType, sortDirection } = this.state;
      const newSortDirection = sortType === newSortType ? (0 - sortDirection) : 1;
      this.setState({
        sortType: newSortType,
        sortDirection: newSortDirection,
      }, () => this.reloadSessions());
    }

    loadSessions = (startIndex = 0, stopIndex = defaultMinimumSessions, sortType = 'createdAt', direction = -1, filterValue = '', reset = true) => {
      const { protocol } = this.props;
      if (!protocol) {
        return Promise.resolve();
      }
      const loadPromise = this.apiClient.get(`${this.sessionsEndpoint}/${startIndex}/${stopIndex}/${sortType}/${direction}/${filterValue}`);
      this.loadPromises.push(loadPromise);
      return (new Promise((resolve, reject) => (loadPromise
        .then((resp) => {
          if (!loadPromise.cancelled) {
            let sessions;
            if (reset) {
              sessions = resp.sessions.map(viewModelMapper);
            } else {
              const { sessions: stateSessions } = this.state;
              sessions = !!startIndex && stateSessions ? stateSessions : [];
              // fill blank indexes between previously loaded and just loaded
              if (startIndex > sessions.length) {
                sessions = sessions.concat(Array(startIndex - sessions.length));
              }
              // only keep up to the index of just loaded
              sessions = [...sessions.slice(0, startIndex)];
              // add just loaded sessions
              sessions = [...sessions, ...resp.sessions.map(viewModelMapper)];
              // add sessions loaded previously after the just loaded indices
              if (stateSessions && sessions.length < stateSessions.length) {
                sessions = sessions.concat(
                  stateSessions.slice(stopIndex, stateSessions.length),
                );
              }
            }
            this.setState({
              sessions,
              totalSessionsCount: resp.totalSessions,
            // eslint-disable-next-line no-return-assign
            });
          }
        })
        .catch((err) => {
          if (!loadPromise.cancelled) {
            logger.error(err);
            this.setState({ sessions: [] }, () => reject(err));
          }
        })
        .then(() => {
          pull(this.loadPromises, loadPromise);
          resolve();
        }))));
    }

    debouncedReload = () => debounce(this.reloadSessions, 200);

    loadMoreSessions = (startIndex, stopIndex) => {
      const {
        sortType,
        sortDirection,
        filterValue,
      } = this.state;

      return (
        this.loadSessions(
          startIndex,
          stopIndex,
          sortType,
          sortDirection,
          filterValue,
          false,
        )
      );
    }

    reloadSessions = () => {
      const {
        sessions,
        sortType,
        sortDirection,
        filterValue,
      } = this.state;
      const numSessions = sessions.length < defaultMinimumSessions
        ? defaultMinimumSessions : sessions.length;
      return this.loadSessions(
        0,
        numSessions,
        sortType,
        sortDirection,
        filterValue,
      );
    }

    deleteAllSessions = () => {
      this.apiClient.delete(this.sessionsEndpoint)
        .then(() => this.reloadSessions());
    }

    deleteSelectedSessions = (selectedSessions) => {
      if (!selectedSessions) return;
      const deletePromises = selectedSessions.map(
        (session) => this.apiClient.delete(this.sessionEndpoint(session)),
      );
      Promise.all(deletePromises)
        .then(() => this.reloadSessions());
    }

    deleteSession = (sessionId) => {
      this.apiClient.delete(this.sessionEndpoint(sessionId))
        .then(() => this.reloadSessions());
    }

    sessionEndpoint(sessionId) {
      const base = this.sessionsEndpoint;
      return base && `${base}/${sessionId}`;
    }

    render() {
      const {
        sessions, totalSessionsCount, filterValue, sortType, sortDirection,
      } = this.state;
      return (
        <WrappedComponent
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...this.props}
          sessions={sessions}
          totalSessionsCount={totalSessionsCount}
          deleteAllSessions={this.deleteAllSessions}
          deleteSelectedSessions={this.deleteSelectedSessions}
          deleteSession={this.deleteSession}
          loadMoreSessions={this.loadMoreSessions}
          sortType={sortType}
          sortDirection={sortDirection}
          sortSessions={this.sortSessions}
          filterValue={filterValue}
          changeFilter={this.changeFilter}
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
  loadMoreSessions: PropTypes.function,
  sortType: PropTypes.string,
  sortDirection: PropTypes.number,
  sortSessions: PropTypes.function,
  filterValue: PropTypes.string,
  changeFilter: PropTypes.function,
};

export default withSessions;

export {
  providedPropTypes,
};
