/* eslint no-underscore-dangle: ["error", { "allow": ["_caseID"] }] */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { Button, Spinner } from '@codaco/ui';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { selectors as protocolSelectors } from '../ducks/modules/protocols';
import { DismissButton, ScrollingPanelItem } from '../components';
import withSessions from './workspace/withSessions';
import Types from '../types';
import { formatDate } from '../utils/formatters';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class CaseManagement extends Component {
  get header() {
    const { sessions, totalSessionsCount } = this.props;
    const countText = (totalSessionsCount && sessions.length < totalSessionsCount) ? `(${sessions.length} of ${totalSessionsCount})` : '';
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
    const { sessions, protocol, protocolsHaveLoaded, history } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    console.log(sessions);

    return (
      <div>
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
        <div className="settings__footer">
          <Button color="primary" onClick={() => history.goBack()}>Finished</Button>
        </div>
      </div>
    );
  }
}

CaseManagement.defaultProps = {
  sessions: [],
  totalSessionsCount: 0,
  protocol: null,
};

CaseManagement.propTypes = {
  deleteSession: PropTypes.func.isRequired,
  deleteAllSessions: PropTypes.func.isRequired,
  sessions: PropTypes.array,
  totalSessionsCount: PropTypes.number,
  openDialog: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: protocolSelectors.protocolsHaveLoaded(state),
  protocol: protocolSelectors.currentProtocol(state, ownProps),
});

function mapDispatchToProps(dispatch) {
  return {
    openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  withSessions,
)(CaseManagement);

export {
  CaseManagement as UnconnectedCaseManagement,
};
