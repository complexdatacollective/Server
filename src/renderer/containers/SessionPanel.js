import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';

import withApiClient from '../components/withApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';

import { DismissButton, ScrollingPanelItem } from '../components';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class SessionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      sessions: [],
    };
  }

  componentDidMount() {
    this.loadSessions();
  }

  componentDidUpdate(prevProps) {
    const newProtocol = this.props.protocolId && this.props.protocolId !== prevProps.protocolId;
    const newClient = this.props.apiClient && this.props.apiClient !== prevProps.apiClient;
    if (newProtocol || newClient) {
      this.loadSessions();
    }
  }

  get sessionsEndpoint() {
    const id = this.props.protocolId;
    return id && `/protocols/${id}/sessions`;
  }

  get header() {
    return (
      <div className="session-panel__header">
        <h4 className="session-panel__header-text">Imported Sessions</h4>
        {
          this.state.sessions.length > 0 &&
          <DismissButton small inline onClick={() => this.deleteAllSessions()}>
            Delete all
          </DismissButton>
        }
      </div>
    );
  }

  setSessions(sessions = []) {
    this.setState({ isLoading: false, sessions: sessions.map(viewModelMapper) });
  }

  loadSessions() {
    const { apiClient, protocolId } = this.props;
    if (!protocolId || !apiClient) {
      return;
    }
    this.setState({ isLoading: true });
    apiClient.get(this.sessionsEndpoint)
      .then(resp => resp.sessions)
      .then(sessions => this.setSessions(sessions))
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
        .then(() => this.setSessions([]))
        .catch(console.error);
    }
  }

  render() {
    const { sessions } = this.state;

    return (
      <ScrollingPanelItem header={this.header}>
        { (this.state.sessions.length === 0) && !this.state.isLoading && emptyContent }
        <ul>
          {sessions.map(s => <li key={s.id}>{s.id}</li>)}
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
  SessionPanel as UnconnectedSessionPanel,
};
