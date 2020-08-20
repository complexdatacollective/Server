import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { includes, without } from 'lodash';
import { Button, Spinner } from '@codaco/ui';
import { Text } from '@codaco/ui/lib/components/Fields';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { selectors as protocolSelectors } from '../ducks/modules/protocols';
import { CaseTable, DismissButton } from '../components';
import withSessions from './workspace/withSessions';
import Types from '../types';

const emptyContent = (<p>Interviews you import from Network Canvas will appear here.</p>);

class CaseManagement extends Component {
  constructor(props) {
    super(props);
    this.state = { sessionsToDelete: [], width: 500, height: 300 };
    this.resizeObserver = null;
    this.resizeSubject = createRef();
  }

  componentDidMount() {
    this.observe(ResizeObserver);
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect();
  }

  get header() {
    const { sessions, filterValue, changeFilter } = this.props;
    return (
      <div className="case-management__header-text">
        <div className="case-management__filter">
          <h4>Filter:&nbsp;</h4>
          <Text
            type="text"
            placeholder="Filter Items..."
            className="case-management__filter-text"
            input={{
              value: filterValue,
              onChange: changeFilter,
            }}
          />
        </div>
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

  observe = (RO) => {
    this.resizeObserver = new RO((entries) => {
      const {
        width,
        height,
      } = entries[0].contentRect;
      this.setState({ width, height });
    });

    if (this.resizeSubject.current) {
      this.resizeObserver.observe(this.resizeSubject.current);
    }
  };

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

  render() {
    const {
      sessions,
      protocol,
      protocolsHaveLoaded,
      history,
      loadMoreSessions,
      totalSessionsCount,
      sortType,
      sortDirection,
      sortSessions,
    } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    let content;
    let classes;
    if (!protocol || !sessions) { // This protocol hasn't loaded yet
      content = <Spinner />;
      classes = 'case-management--loading';
    } else {
      content = (
        <React.Fragment>
          <div className="case-management__header">{this.header}</div>
          {(sessions && sessions.length === 0) && emptyContent }
          {
            (sessions && sessions.length !== 0) &&
              <div className="case-management__table">
                <CaseTable
                  list={sessions}
                  loadMoreSessions={loadMoreSessions}
                  sortType={sortType}
                  sortDirection={sortDirection}
                  sortSessions={sortSessions}
                  totalSessionsCount={totalSessionsCount}
                  updateSessionsToDelete={this.updateSessionsToDelete}
                  isSessionSelected={this.isSessionSelected}
                  allSessionsSelected={this.allSessionsSelected}
                  toggleAllSessions={this.toggleAllSessions}
                  width={this.state.width}
                  height={this.state.height - 160}
                />
              </div>
          }
          <div className="case-management__footer">
            <Button color="primary" onClick={() => history.goBack()}>Finished</Button>
          </div>
        </React.Fragment>
      );
      classes = 'case-management';
    }

    return (
      <div ref={this.resizeSubject} className={classes}>
        {content}
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
  loadMoreSessions: PropTypes.func.isRequired,
  sessions: PropTypes.array,
  totalSessionsCount: PropTypes.number,
  openDialog: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  filterValue: PropTypes.string.isRequired,
  changeFilter: PropTypes.func.isRequired,
  sortType: PropTypes.string.isRequired,
  sortDirection: PropTypes.number.isRequired,
  sortSessions: PropTypes.func.isRequired,
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
