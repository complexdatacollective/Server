/* eslint no-underscore-dangle: ["error", { "allow": ["_caseID"] }] */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { DismissButton, ScrollingPanelItem } from '../../components';
import { formatDate } from '../../utils/formatters';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class SessionPanel extends Component {
  get header() {
    const { sessions, totalCount } = this.props;
    const countText = (totalCount && sessions.length < totalCount) ? `(${sessions.length} of ${totalCount})` : '';
    return (
      <div className="dashboard__header session-panel__header">
        <h4 className="dashboard__header-text">
          Imported Interviews
          <small className="session-panel__header-count">
            {countText}
          </small>
        </h4>
        {
          sessions && sessions.length > 0 &&
          <DismissButton small inline onClick={() => this.deleteAllSessions()}>
            Delete all
          </DismissButton>
        }
      </div>
    );
  }

  deleteAllSessions() {
    this.props.openDialog({
      type: 'Warning',
      title: 'Delete all interview sessions?',
      confirmLabel: 'Delete all sessions',
      onConfirm: () => this.props.deleteAllSessions(),
      message: 'Are you sure you want to delete all interview sessions? This action cannot be undone!',
    });
  }

  deleteSession(sessionId) {
    if (!sessionId) {
      return;
    }

    this.props.openDialog({
      type: 'Confirm',
      title: 'Delete this interview session?',
      confirmLabel: 'Delete this session',
      onConfirm: () => this.props.deleteSession(sessionId),
      message: 'Are you sure you want to delete this interview session? This action cannot be undone!',
    });
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
                  {s.data && s.data.sessionVariables && s.data.sessionVariables._caseID}
                  {' - '}
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
  openDialog: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  openDialog: dialogActions.openDialog,
};

export default connect(null, mapDispatchToProps)(SessionPanel);

export {
  SessionPanel as UnconnectedSessionPanel,
};
