import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Modal, Progress, Button } from '@codaco/ui';
import Loading from './Loading';
import NoResults from './NoResults';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import useEntityState from './useEntityState';
import finializeResolutions from './finalizeResolutions';
import './Resolver.scss';

const states = {
  LOADING: 'LOADING',
  NO_RESULTS: 'NO_RESULTS',
  REVIEW: 'REVIEW',
  WAITING: 'WAITING',
  RESOLVING: 'RESOLVING',
};

const getStatus = ({ hasData, isLoadingMatches, isComplete, match }) => {
  if (!hasData && isLoadingMatches) { return states.LOADING; }
  if (!hasData && !isLoadingMatches) { return states.NO_RESULTS; }
  if (isComplete) { return states.REVIEW; } // or "COMPLETE"
  if (!match) { return states.WAITING; } // loaded some data, waiting for more
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
  const [
    { actions, resolutions, currentMatchIndex, isLastMatch, match },
    { resolveMatch, skipMatch, previousMatch },
  ] = useResolverState(matches);

  const [
    { requiredAttributes, resolvedAttributes, isAMatch, isDiffComplete },
    { setAttributes, setNotAMatch, nextDiff, previousDiff },
  ] = useEntityState(
    protocol.codebook,
    match,
    { resolveMatch, skipMatch, previousMatch },
  );

  const handleFinish = () => {
    const finalizedResolutions = finializeResolutions(resolutions);
    onResolve(finalizedResolutions);
  };

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('You will loose any progress, are you sure?')) {
      onCancel();
    }
  };

  const handleClose = () => {
    onCancel();
  };

  const hasData = matches.length > 0;
  const isComplete = hasData && !isLoadingMatches && isLastMatch;
  const status = getStatus({ hasData, isLoadingMatches, isComplete, match });

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
            value={currentMatchIndex + 1}
            max={matches.length}
          />
        );
      default:
        return null;
    }
  };

  const contentClasses = cx(
    'resolver__main',
    {
      'resolver__main--loading': status === states.LOADING,
      'resolver__main--no-results': status === states.NO_RESULTS,
    },
  );

  return (
    <Modal show={show}>
      <div className="resolver">
        <div className="resolver__heading">
          {renderHeading()}
        </div>
        <div key={status} className={contentClasses}>
          <div className="resolver__content">
            {resolveRequestId}
            { status === states.LOADING &&
              <Loading key="loading" />
            }
            { status === states.NO_RESULTS &&
              <NoResults key="empty" onClose={handleClose} />
            }
            { status === states.RESOLVING &&
              <EntityDiff
                key="diff"
                codebook={protocol.codebook}
                match={match}
                requiredAttributes={requiredAttributes}
                resolvedAttributes={resolvedAttributes}
                setAttributes={setAttributes}
                setNotAMatch={setNotAMatch}
                isAMatch={isAMatch}
              />
            }
            { status === states.REVIEW &&
              <ReviewTable
                key="review"
                codebook={protocol.codebook}
                matches={matches}
                actions={actions}
              />
            }
          </div>
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
              `${currentMatchIndex + 1} of ${matches.length}`
            }
          </div>
          <div className="resolver__controls resolver__controls--right">
            { status === states.RESOLVING && currentMatchIndex > 0 &&
              <Button color="white" onClick={previousDiff}>Back</Button>
            }
            { status === states.RESOLVING &&
              <Button
                disabled={!isDiffComplete}
                onClick={nextDiff}
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
