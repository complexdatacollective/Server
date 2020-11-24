import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import { compose } from 'recompose';
import { caseProperty } from '../../../main/utils/network-exporters/src/utils/reservedAttributes';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { selectors as protocolSelectors } from '../../ducks/modules/protocols';
import { DismissButton, ScrollingPanelItem } from '../../components';
import { formatDate } from '../../utils/formatters';

const emptyContent = (<p>
  Interviews you import from Network Canvas Interviewer will appear here.</p>);
const maxRecentSessions = 5;

class SessionPanel extends Component {
  get header() {
    const { sessions, totalCount } = this.props;
    const visibleSessions = maxRecentSessions < sessions.length ?
      maxRecentSessions : sessions.length;
    const countText = (totalCount && visibleSessions < totalCount) ?
      `(${visibleSessions} of ${totalCount})` : '';
    return (
      <div className="dashboard__header session-panel__header">
        <h4 className="dashboard__header-text">
          Most Recent Sessions
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
    const { currentProtocolId, sessions } = this.props;

    return (
      <ScrollingPanelItem header={this.header} className="session-panel">
        {(sessions && sessions.length === 0) && emptyContent}
        <ul className="session-panel__list">
          {sessions && sessions.map((s, index) => {
            if (index < maxRecentSessions) {
              return (
                <li key={s.id}>
                  <p>
                    <DismissButton small inline onClick={() => this.deleteSession(s.id)} />
                    <span>{formatDate(s.updatedAt)}</span>
                    <span className="session-panel__id">
                      {s.data && s.data.sessionVariables &&
                        (s.data.sessionVariables[caseProperty])}
                      {' - '}
                      {s.id && s.id.substring(0, 13)}
                    </span>
                  </p>
                </li>
              );
            }
            return '';
          })}
        </ul>
        <Link to={`/workspaces/${currentProtocolId}/casemanagement`} className="session-panel__link">Manage Cases</Link>
      </ScrollingPanelItem>
    );
  }
}

SessionPanel.defaultProps = {
  currentProtocolId: '',
  sessions: [],
  totalCount: 0,
};

SessionPanel.propTypes = {
  currentProtocolId: PropTypes.string,
  deleteSession: PropTypes.func.isRequired,
  deleteAllSessions: PropTypes.func.isRequired,
  sessions: PropTypes.array,
  totalCount: PropTypes.number,
  openDialog: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  currentProtocolId: protocolSelectors.currentProtocolId(state, ownProps),
});

function mapDispatchToProps(dispatch) {
  return {
    openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SessionPanel);

export {
  SessionPanel as UnconnectedSessionPanel,
};
