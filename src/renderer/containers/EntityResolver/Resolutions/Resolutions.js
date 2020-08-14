import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { get, reduce } from 'lodash';
import cx from 'classnames';
import { Modal, ProgressBar } from '@codaco/ui';
import useResolver from '%renderer/hooks/useResolver';
import useAdminClient from '%renderer/hooks/useAdminClient';
import Loading from './Loading';
import NoResults from './NoResults';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import ControlBar from './ControlBar';
import useResolutionsState from './useResolutionsState';
import useEntityState from './useEntityState';
import finializeResolutions from './finalizeResolutions';
import states, { getStatus } from './states';
import './Resolver.scss';

const Resolver = React.forwardRef(({
  onComplete,
}, ref) => {
  const { saveResolution } = useAdminClient();

  const [resolverState, resolveProtocol, abortResolution] = useResolver();

  useEffect(() => {
    if (ref && !ref.current) {
      ref.current = { // eslint-disable-line no-param-reassign
        resolveProtocol,
      };
    }
  }, [ref, resolverState.requestId]);

  const [resolutionsState, resolutionsActions] =
    useResolutionsState(resolverState.matches, [resolverState.requestId]);

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
    console.log('next', diffState);
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
      .finally(abortResolution); // for good measure
  };

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('You will loose any progress, are you sure?')) {
      abortResolution();
    }
  };

  const handleClose = () => {
    abortResolution();
  };

  const hasData = resolverState.matches.length > 0;
  const isComplete = hasData && !resolverState.isLoadingMatches && resolutionsState.isLastMatch;
  const status = getStatus({
    hasData,
    isLoadingMatches: resolverState.isLoadingMatches,
    isComplete,
    match: resolutionsState.match,
  });

  const currentMatch = resolutionsState.currentMatchIndex + 1;
  const totalMatches = get(resolverState, 'matches.length', 1);
  const percentProgress = (currentMatch / totalMatches) * 100;
  // If we're still loading prevent the 100% animation
  const resolvingProgress = resolverState.isLoadingMatches && percentProgress === 100
    ? 99
    : percentProgress;

  const heading = {
    [states.NO_RESULTS]: (<h2>No results</h2>),
    [states.REVIEW]: (<h2>Review matches</h2>),
    [states.RESOLVING]: (
      <ProgressBar
        percentProgress={resolvingProgress}
        orientation="horizontal"
        indeterminate
      />
    ),
    [states.LOADING]: (<ProgressBar percentProgress={33} orientation="horizontal" indeterminate />),
    [states.WAITING]: (
      <ProgressBar
        percentProgress={percentProgress}
        orientation="horizontal"
        indeterminate
      />
    ),
  }[status];

  const content = {
    [states.LOADING]: <Loading key="loading" />,
    [states.WAITING]: <Loading key="waiting" />,
    [states.NO_RESULTS]: <NoResults key="empty" onClose={handleClose} />,
    [states.RESOLVING]: (
      <EntityDiff
        key={`diff_${currentMatch}`}
        codebook={codebook}
        match={resolutionsState.match}
        requiredAttributes={diffState.requiredAttributes}
        resolvedAttributes={diffState.resolvedAttributes}
        setAttributes={diffActions.setAttributes}
        setNotAMatch={diffActions.setNotAMatch}
        isAMatch={diffState.isAMatch}
      />
    ),
    [states.REVIEW]: (
      <ReviewTable
        key="review"
        codebook={codebook}
        matches={resolverState.matches}
        actions={resolutionsActions.actions}
      />
    ),
  }[status];

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
          {heading}
        </div>
        <div key={status} className={contentClasses}>
          <div className="resolver__content">
            {content}
          </div>
        </div>
        <ControlBar
          currentMatch={currentMatch}
          onBack={previousDiff}
          onCancel={handleCancel}
          onClose={handleClose}
          onFinish={handleFinish}
          onNext={nextDiff}
          isDiffComplete={diffState.isDiffComplete}
          isLoadingMatches={resolverState.isLoadingMatches}
          status={status}
          totalMatches={totalMatches}
        />
      </div>
    </Modal>
  );
});

Resolver.propTypes = {
  onComplete: PropTypes.func.isRequired,
};

export default Resolver;
