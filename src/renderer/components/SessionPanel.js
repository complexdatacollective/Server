import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { DismissButton, ScrollingPanelItem } from '../components';
import { formatDate } from '../utils/formatters';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class SessionPanel extends Component {
  get header() {
    const { sessions = [] } = this.props;
    const { totalCount } = this.props;
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

  deleteAllSessions() {
    if (confirm('Delete all sessions for this protocol?')) { // eslint-disable-line no-alert
      this.props.deleteAllSessions();
    }
  }

  deleteSession(sessionId) {
    if (!sessionId) {
      return;
    }
    if (confirm('Delete this session?')) { // eslint-disable-line no-alert
      this.props.deleteSession(sessionId);
    }
  }

  render() {
    const { sessions } = this.props;

    return (
      <ScrollingPanelItem header={this.header}>
        { (sessions && sessions.length === 0) && emptyContent }
        <ul className="session-panel__list">
          {sessions && sessions.map(s => (
            <li key={s.id}>
              <p>
                <DismissButton small inline onClick={() => this.deleteSession(s.id)} />
                <span>{formatDate(s.updatedAt)}</span>
                <span className="session-panel__id">
                  {s.id && s.id.substring(0, 13)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </ScrollingPanelItem>
    );
  }
}

SessionPanel.defaultProps = {
  sessions: [],
  totalCount: 0,
};

SessionPanel.propTypes = {
  deleteSession: PropTypes.func.isRequired,
  deleteAllSessions: PropTypes.func.isRequired,
  sessions: PropTypes.array,
  totalCount: PropTypes.number,
};

export default SessionPanel;
