import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import cx from 'classnames';
import { Modal, Progress, Button } from '@codaco/ui';
import useResolver from '../useResolver';
import Loading from './Loading';
import NoResults from './NoResults';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolutionsState from './useResolutionsState';
import useEntityState from './useEntityState';
import finializeResolutions from './finalizeResolutions';
import './Resolver.scss';

// const [resolverState, resolveProtocol, resetResolver] = useResolver(showConfirmation, openDialog);

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

const Resolver = React.forwardRef(({
  onComplete,
  saveResolution,
}, ref) => {
  const [
    resolverState,
    resolveProtocol,
    resetResolver,
  ] = useResolver();

  const {
    show,
    isLoadingMatches,
    matches,
    resolveRequestId,
    protocol,
  } = resolverState;

  const codebook = get(protocol, 'codebook', {});

  useEffect(() => {
    if (ref && !ref.current) {
      ref.current = { resolveProtocol }; // eslint-disable-line no-param-reassign
    }
  }, [ref]);

  const [
    { actions, resolutions, currentMatchIndex, isLastMatch, match },
    { resolveMatch, skipMatch, previousMatch },
  ] = useResolutionsState(matches);

  // todo, can we move this to diff'er?
  const [
    { requiredAttributes, resolvedAttributes, isAMatch, isDiffComplete },
    { setAttributes, setNotAMatch, nextDiff, previousDiff },
  ] = useEntityState(
    codebook,
    match,
    { resolveMatch, skipMatch, previousMatch },
  );

  const handleFinish = () => {
    const finalizedResolutions = finializeResolutions(resolutions);

    saveResolution(protocol, exportSettings, finalizedResolutions) // adminApi
      .then(({ resolutionId }) => onComplete({
        resolutionId,
        enableEntityResolution: true,
        createNewResolution: false,
        resolutionsKey: resolutionId, // trigger reload of resolutions
      }))
      .finally(resetResolver);
  };

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('You will loose any progress, are you sure?')) {
      resetResolver();
    }
  };

  const handleClose = () => {
    resetResolver();
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
                codebook={codebook}
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
                codebook={codebook}
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
});

Resolver.propTypes = {
  onComplete: PropTypes.func.isRequired,
};

export default Resolver;
