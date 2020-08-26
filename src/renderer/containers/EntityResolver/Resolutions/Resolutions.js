import React, { useEffect, useState } from 'react';
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
import finializeResolutions from './finalizeResolutions';
import states, { getStatus } from './states';
import { getNodeTypeDefinition } from './selectors';
import './Resolver.scss';

const initialDiffState = {
  isTouched: false,
  isDiffComplete: false,
  resolvedAttributes: {},
  isMatchType: null,
};

const Resolutions = React.forwardRef(({
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

  const egoCastType = resolverState.exportSettings.egoCastType;
  const nodeTypeDefinition = getNodeTypeDefinition(codebook, egoCastType);

  const [diffState, setDiffState] = useState(initialDiffState);

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
    if (!diffState.isTouched) {
      return;
    }

    if (diffState.isMatchType === 'MISMATCH') {
      // not a match, don't apply any resolved attributes
      resolutionsActions.skipMatch(resolutionsState.match);
      return;
    }

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

    resolutionsActions.resolveMatch(resolutionsState.match, fullResolvedAttributes);
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
    [states.NO_RESULTS]: (<h2 key="empty">No results</h2>),
    [states.REVIEW]: (<h2 key="review">Review matches</h2>),
    [states.RESOLVING]: (
      <ProgressBar
        key="resolve"
        percentProgress={resolvingProgress}
        orientation="horizontal"
        indeterminate={resolverState.isLoadingMatches}
      />
    ),
    [states.LOADING]: (
      <ProgressBar
        key="loading"
        percentProgress={33}
        orientation="horizontal"
        indeterminate
      />),
    [states.WAITING]: (
      <ProgressBar
        key="waiting"
        percentProgress={percentProgress}
        orientation="horizontal"
        indeterminate
      />
    ),
  }[status];

  // check if there is an existing resolution
  const existingResolution = resolutionsState.resolutions
    .find(({ matchIndex }) => matchIndex === resolutionsState.match.index);
  const resolvedAttributes = get(existingResolution, 'attributes', {});

  const content = {
    [states.LOADING]: <Loading key="loading" />,
    [states.WAITING]: <Loading key="waiting" />,
    [states.NO_RESULTS]: <NoResults key="empty" onClose={handleClose} />,
    [states.RESOLVING]: (
      <EntityDiff
        key={`diff_${currentMatch}`}
        onChange={setDiffState}
        entityDefinition={nodeTypeDefinition}
        resolvedAttributes={resolvedAttributes}
        match={resolutionsState.match}
      />
    ),
    [states.REVIEW]: (
      <ReviewTable
        key="review"
        nodeTypeDefinition={nodeTypeDefinition}
        matches={resolverState.matches}
        actions={resolutionsState.actions}
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

Resolutions.propTypes = {
  onComplete: PropTypes.func.isRequired,
};

export default Resolutions;
