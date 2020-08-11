import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { get, reduce } from 'lodash';
import cx from 'classnames';
import { Modal, Progress, Button } from '@codaco/ui';
import useResolver from '%renderer/hooks/useResolver';
import useAdminClient from '%renderer/hooks/useAdminClient';
import Loading from './Loading';
import NoResults from './NoResults';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolutionsState from './useResolutionsState';
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

const Resolver = React.forwardRef(({
  onComplete,
}, ref) => {
  const { saveResolution } = useAdminClient();

  const [resolverState, resolveProtocol, resetResolver] = useResolver();

  useEffect(() => {
    if (ref && !ref.current) {
      ref.current = { // eslint-disable-line no-param-reassign
        resolveProtocol,
      };
    }
  }, [ref, resolverState.resolveRequestId]);

  const [resolutionsState, resolutionsActions] =
    useResolutionsState(resolverState.matches);

  const codebook = get(resolverState, ['protocol', 'codebook'], {});

  // todo, can we move this to diff'er?
  const [diffState, diffActions] = useEntityState(codebook, resolutionsState.match);

  const previousDiff = () => {
    if (!(
      !diffState.isTouched ||
      window.confirm('Looks like you have set some attributes, are you sure?') // eslint-disable-line
    )) {
      return;
    }

    resolutionsActions.previousMatch();
  };

  const nextDiff = () => {
    console.log('next',  diffState);
    if (!diffState.isTouched) {
      return;
    }

    if (diffState.isAMatch) {
      // TODO: set error state
      if (!diffState.isDiffComplete) {
        window.alert("Looks like you haven't chosen all the attributes yet?") // eslint-disable-line
        return;
      }

      const resolved = reduce(diffState.resolvedAttributes, (obj, resolution, variable) => ({
        ...obj,
        [variable]: resolutionsState.match.nodes[resolution].attributes[variable],
      }), {});

      const fullResolvedAttributes = {
        // include values we filtered out (ones that were equal)
        ...resolutionsState.match.nodes[0].attributes,
        ...resolved,
      };

      console.log('next', resolutionsState.match, fullResolvedAttributes, resolutionsActions.resolveMatch);

      resolutionsActions.resolveMatch(resolutionsState.match, fullResolvedAttributes);
      return;
    }

    // if !isAMatch
    resolutionsActions.skipMatch(resolutionsState.match);
  };

  const handleFinish = () => {
    const finalizedResolutions = finializeResolutions(resolutionsState.resolutions);

    saveResolution(
      resolverState.protocol,
      resolverState.exportSettings,
      finalizedResolutions,
    ) // adminApi
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

  const hasData = resolverState.matches.length > 0;
  const isComplete = hasData && !resolverState.isLoadingMatches && resolutionsState.isLastMatch;
  const status = getStatus({
    hasData,
    isLoadingMatches: resolverState.isLoadingMatches,
    isComplete,
    match: resolutionsState.match,
  });

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
            value={resolutionsState.currentMatchIndex + 1}
            max={resolverState.matches.length}
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
    <Modal show={resolverState.showResolver}>
      <div className="resolver">
        <div className="resolver__heading">
          {renderHeading()}
        </div>
        <div key={status} className={contentClasses}>
          <div className="resolver__content">
            {resolverState.resolveRequestId}
            { status === states.LOADING &&
              <Loading key="loading" />
            }
            { status === states.WAITING &&
              <Loading key="waiting" />
            }
            { status === states.NO_RESULTS &&
              <NoResults key="empty" onClose={handleClose} />
            }
            { status === states.RESOLVING &&
              <EntityDiff
                key="diff"
                codebook={codebook}
                match={resolutionsState.match}
                requiredAttributes={diffState.requiredAttributes}
                resolvedAttributes={diffState.resolvedAttributes}
                setAttributes={diffActions.setAttributes}
                setNotAMatch={diffActions.setNotAMatch}
                isAMatch={diffState.isAMatch}
              />
            }
            { status === states.REVIEW &&
              <ReviewTable
                key="review"
                codebook={codebook}
                matches={resolverState.matches}
                actions={resolutionsActions.actions}
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
              `${resolutionsState.currentMatchIndex + 1} of ${resolverState.matches.length}`
            }
          </div>
          <div className="resolver__controls resolver__controls--right">
            { status === states.RESOLVING && resolutionsState.currentMatchIndex > 0 &&
              <Button color="white" onClick={previousDiff}>Back</Button>
            }
            { status === states.RESOLVING &&
              <Button
                disabled={!diffState.isDiffComplete}
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
