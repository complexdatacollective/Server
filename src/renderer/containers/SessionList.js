import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';

import withApiClient from '../components/withApiClient';
import viewModelMapper from '../utils/baseViewModelMapper';

class SessionList extends Component {
  constructor(props) {
    super(props);
    this.state = {
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

  loadSessions() {
    const { apiClient, protocolId } = this.props;
    if (!protocolId || !apiClient) {
      return;
    }
    apiClient.get(`/protocols/${protocolId}/sessions`)
      .then(resp => resp.sessions)
      .then(sessions => this.setState({ sessions: sessions.map(viewModelMapper) }))
      .catch((err) => {
        logger.error(err);
        this.setState({ sessions: [] });
      });
  }

  render() {
    const { sessions } = this.state;
    return (
      <div>
        <h4>Sessions</h4>
        <ul>
          {sessions.map(s => <li key={s.id}>{s.updatedAt.toLocaleString()}</li>)}
        </ul>
      </div>
    );
  }
}

SessionList.defaultProps = {
  apiClient: null,
  protocolId: null,
};

SessionList.propTypes = {
  apiClient: PropTypes.object,
  protocolId: PropTypes.string,
};

export default withApiClient(SessionList);

export {
  SessionList as UnconnectedSessionList,
};
