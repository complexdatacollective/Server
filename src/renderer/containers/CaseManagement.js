/* eslint no-underscore-dangle: ["error", { "allow": ["_caseID"] }] */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { includes, without } from 'lodash';
import { Button, Spinner } from '@codaco/ui';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { selectors as protocolSelectors } from '../ducks/modules/protocols';
import { CaseTable, DismissButton, ScrollingPanelItem } from '../components';
import withSessions from './workspace/withSessions';
import Types from '../types';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class CaseManagement extends Component {
  constructor(props) {
    super(props);
    this.state = { sessionsToDelete: [], width: 500 };
  }

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
          <DismissButton
            small
            inline
            onClick={() => this.deleteSelectedSessions(this.state.sessionsToDelete)}
          >
            Delete selected
          </DismissButton>
        }
      </div>
    );
  }

  isSessionSelected = id => includes(this.state.sessionsToDelete, id);

  allSessionsSelected = () => this.state.sessionsToDelete.length === this.props.sessions.length;

  updateSessionsToDelete = (id) => {
    if (includes(this.state.sessionsToDelete, id)) {
      this.setState({ sessionsToDelete: without(this.state.sessionsToDelete, id) });
    } else {
      this.setState({
        sessionsToDelete: [
          ...this.state.sessionsToDelete,
          id,
        ],
      });
    }
  };

  toggleAllSessions = () => {
    let selectedSessions = [];
    if (this.state.sessionsToDelete.length !== this.props.sessions.length) {
      selectedSessions = this.props.sessions.map(session => session.id);
    }
    this.setState({
      sessionsToDelete: [...selectedSessions],
    });
  };

  deleteSelectedSessions = (sessionsToDelete) => {
    if (!sessionsToDelete || sessionsToDelete.length < 1) return;

    this.props.openDialog({
      type: 'Warning',
      title: 'Delete selected interview sessions?',
      confirmLabel: 'Delete selected sessions',
      onConfirm: () => {
        this.props.deleteSelectedSessions(sessionsToDelete);
        this.setState({ sessionsToDelete: [] });
      },
      message: 'Are you sure you want to delete selected interview sessions? This action cannot be undone!',
    });
  }

  refCallback = (element) => {
    if (element) {
      this.setState({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      });
    }
  };

  render() {
    const { sessions, protocol, protocolsHaveLoaded, history } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    return (
      <div ref={this.refCallback}>
        <ScrollingPanelItem header={this.header}>
          { (sessions && sessions.length === 0) && emptyContent }
          <div className="session-panel__list">
            {sessions &&
            <CaseTable
              list={sessions}
              loadMoreSessions={this.props.loadMoreSessions}
              hasMoreSessions={this.props.hasMoreSessions}
              totalSessionsCount={this.props.totalSessionsCount}
              updateSessionsToDelete={this.updateSessionsToDelete}
              isSessionSelected={this.isSessionSelected}
              allSessionsSelected={this.allSessionsSelected}
              toggleAllSessions={this.toggleAllSessions}
              width={this.state.width - 50}
              height={297}
            />}
          </div>
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
  deleteSelectedSessions: PropTypes.func.isRequired,
  hasMoreSessions: PropTypes.func.isRequired,
  loadMoreSessions: PropTypes.func.isRequired,
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
