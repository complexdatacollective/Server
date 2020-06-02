import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner, Button } from '@codaco/ui';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';
import finializeResolutions from './finalizeResolutions';
import { getMatch, getMatchOrResolved } from './helpers';

const states = {
  LOADING: 'LOADING',
  NO_RESULTS: 'NO_RESULTS',
  REVIEW: 'REVIEW',
  WAITING: 'WAITING',
  RESOLVING: 'RESOLVING',
};

const getStatus = ({ hasData, isLoadingMatches, isComplete, matchOrResolved }) => {
  if (!hasData && isLoadingMatches) { return states.LOADING; }
  if (!hasData && !isLoadingMatches) { return states.NO_RESULTS; }
  if (isComplete) { return states.REVIEW; } // or "COMPLETE"
  if (!matchOrResolved) { return states.WAITING; } // loaded some data, waiting for more
  return states.RESOLVING;
};

const Resolver = ({
  isLoadingMatches,
  matches,
  show,
  onCancel,
  onResolve,
  resolveRequestId,
}) => {
  const [state, handlers] = useResolverState();

  const { resolveMatch, skipMatch, reset } = handlers;

  const match = getMatch(matches, state.currentMatchIndex);
  const matchOrResolved = getMatchOrResolved(match, state.resolutions);

  const hasData = matches.length > 0;
  const isLastMatch = state.currentMatchIndex >= matches.length;
  const isComplete = hasData && !isLoadingMatches && isLastMatch;

  const status = getStatus({ hasData, isLoadingMatches, isComplete, matchOrResolved });

  console.log(status);

  const handleFinish = () => {
    const resolutions = finializeResolutions(state.resolutions);
    onResolve(resolutions);
    reset();
  };

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('You will loose any progress, are you sure?')) {
      reset();
      onCancel();
    }
  };

  const handleClose = () => {
    reset();
    onCancel();
  };

  useEffect(() => {
    reset();
  }, [resolveRequestId]);

  const renderHeading = () => {
    switch (status) {
      case status.NO_RESULTS:
        return <h1>No results</h1>;
      case status.REVIEW:
        return <h1>Review resolutions</h1>;
      case status.LOADING:
      case status.WAITING:
        return <h1>Loading results...</h1>;
      default:
        return (
          <Progress
            value={state.currentMatchIndex + 1}
            max={matches.length}
            // active={isLoadingMatches}
          />
        );
    }
  };

  return (
    <Modal show={show}>
      <div className="resolver">
        <div className="resolver__heading">
          {renderHeading()}
        </div>
        <div className={`resolver__content resolver__content--${status.toLowerCase()}`}>
          { status === states.LOADING &&
            <div>
              <Spinner />
              <Button color="white" onClick={handleCancel}>Cancel</Button>
            </div>
          }
          { status === states.NO_RESULTS &&
            <div>
              <p>No match results.</p>
              <Button color="white" onClick={handleClose}>Close</Button>
            </div>
          }
          { status === states.RESOLVING &&
            <div>
              <EntityDiff
                match={matchOrResolved}
                onResolve={resolveMatch}
                onSkip={skipMatch}
                onCancel={handleCancel}
              />
            </div>
          }
          { status === states.REVIEW &&
            <div>
              <ReviewTable
                matches={matches}
                actions={state.actions}
                onConfirm={handleFinish}
                onCancel={handleCancel}
              />
            </div>
          }
        </div>
        <div className="resolver__control-bar">
          <div className="resolver__controls resolver__controls--left">
            <Button color="white">Cancel all</Button>
          </div>
          <div className="resolver__controls resolver__controls--center">
            {state.currentMatchIndex + 1} of {matches.length}
          </div>
          <div className="resolver__controls resolver__controls--right">
            { hasData && [
              <Button color="white">Back</Button>,
              <Button>Next</Button>,
            ]}
          </div>
        </div>
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  isLoadingMatches: PropTypes.bool,
  show: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onResolve: PropTypes.func.isRequired,
  matches: PropTypes.array,
  resolveRequestId: PropTypes.string,
};

Resolver.defaultProps = {
  isLoadingMatches: true,
  show: false,
  matches: null,
  resolveRequestId: null,
};

export default Resolver;
