import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Button } from '@codaco/ui';
import Loading from './Loading';
import NoResults from './NoResults';
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
  protocol,
}) => {
  const [state, handlers] = useResolverState();
  const { resolveMatch, skipMatch, reset } = handlers;

  const entityDiffRef = useRef();

  const match = getMatch(matches, state.currentMatchIndex);
  const matchOrResolved = getMatchOrResolved(match, state.resolutions);

  const hasData = matches.length > 0;
  const isLastMatch = state.currentMatchIndex >= matches.length;
  const isComplete = hasData && !isLoadingMatches && isLastMatch;

  const status = getStatus({ hasData, isLoadingMatches, isComplete, matchOrResolved });

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

  const handleBack = () => {};

  const isDiffReady = entityDiffRef.current && entityDiffRef.current.isReady();

  const handleNext = () =>
    entityDiffRef.current && entityDiffRef.current.onNext();

  useEffect(() => {
    reset();
  }, [resolveRequestId]);

  const renderHeading = () => {
    switch (status) {
      case states.NO_RESULTS:
      case states.LOADING:
        return <h2>Entity Resolution</h2>;
      case states.REVIEW:
        return <h2>Review Resolutions</h2>;
      case states.RESOLVING:
      case states.WAITING:
        return (
          <Progress
            value={state.currentMatchIndex + 1}
            max={matches.length}
            // active={isLoadingMatches}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show}>
      <div className="resolver">
        <div className="resolver__heading">
          {renderHeading()}
        </div>
        <div key="loading-content" className="resolver__content resolver__content--loading">
          { status === states.LOADING &&
            <Loading />
          }
          { status === states.NO_RESULTS &&
            <NoResults onClose={handleClose} />
          }
          { status === states.RESOLVING &&
            <EntityDiff
              codebook={protocol.codebook}
              match={matchOrResolved}
              onResolve={resolveMatch}
              onSkip={skipMatch}
              onBack={handleBack}
              ref={entityDiffRef}
            />
          }
          { status === states.REVIEW &&
            <ReviewTable matches={matches} actions={state.actions} />
          }
        </div>
        <div key="loading-controls" className="resolver__control-bar">
          <div className="resolver__controls resolver__controls--left">
            { status === states.NO_RESULTS &&
              <Button color="white" key="close" onClick={handleClose}>Close</Button>
            }
            { status !== states.NO_RESULTS &&
              <Button color="white" key="cancel" onClick={handleCancel}>Cancel</Button>
            }
          </div>
          <div className="resolver__controls resolver__controls--center">
            { status === states.RESOLVING &&
              `${state.currentMatchIndex + 1} of ${matches.length}`
            }
          </div>
          <div className="resolver__controls resolver__controls--right">
            { status === states.RESOLVING && state.currentMatchIndex > 0 &&
              <Button color="white" onClick={() => entityDiffRef.current.onBack()}>Back</Button>
            }
            { status === states.RESOLVING &&
              <Button
                disabled={!isDiffReady}
                onClick={handleNext}
              >Next</Button>
            }
            { status === states.REVIEW &&
              <Button onClick={handleFinish}>Save and export</Button>
            }
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
  protocol: PropTypes.object,
};

Resolver.defaultProps = {
  protocol: {},
  isLoadingMatches: true,
  show: false,
  matches: null,
  resolveRequestId: null,
};

export default Resolver;
