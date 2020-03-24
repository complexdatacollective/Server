import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner, Icon, Button } from '@codaco/ui';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';
import finializeResolutions from './finalizeResolutions';
import { getMatch, getMatchOrResolved } from './helpers';

const Resolver = ({
  isLoadingMatches,
  matches,
  show,
  onCancel,
  onResolved,
  resolveRequestId,
}) => {
  const [state, handlers] = useResolverState();

  const { resolveMatch, skipMatch, reset } = handlers;

  const match = getMatch(matches, state.currentMatchIndex);
  const matchOrResolved = getMatchOrResolved(match, state.resolutions);

  const hasData = matches.length > 0;
  const isLastMatch = state.currentMatchIndex >= matches.length;
  const isComplete = hasData && !isLoadingMatches && isLastMatch;

  const handleFinish = () => {
    const resolutions = finializeResolutions(state.resolutions);
    onResolved(resolutions);
    reset();
  };

  const handleCancel = () => {
    if (window.confirm('You will loose any progress, are you sure?')) {
      reset();
      onCancel();
    }
  };

  useEffect(() => {
    reset();
  }, [resolveRequestId]);

  const renderHeading = () => {
    if (!hasData && isLoadingMatches) {
      return 'Running resolver script...';
    }

    if (!hasData && !isLoadingMatches) {
      return 'No data';
    }

    if (isComplete) {
      return 'Review Actions';
    }

    if (!matchOrResolved) {
      return 'Waiting for next match...';
    }

    return `Match ${state.currentMatchIndex + 1} of ${matches.length}`;
  };

  const renderContent = () => {
    if (!hasData && !isLoadingMatches) {
      return (
        <div className="resolver__error">
          <Icon name="error" /> No match data (and no pending match data).
        </div>
      );
    }

    if (isComplete) {
      return (
        <div className="resolver__review">
          <ReviewTable
            matches={matches}
            actions={state.actions}
            onConfirm={handleFinish}
            onCancel={handleCancel}
          />
        </div>
      );
    }

    if (!matchOrResolved) {
      return (
        <div className="resolver__loading">
          <Spinner />
          <Button color="white" onClick={handleCancel}>Cancel</Button>
        </div>
      );
    }

    return (
      <div className="resolver__diff">
        <EntityDiff
          match={matchOrResolved}
          onResolve={resolveMatch}
          onSkip={skipMatch}
          onCancel={handleCancel}
        />
      </div>
    );
  };

  if (matches === null) {
    return null;
  }

  return (
    <Modal show={show}>
      <div className="resolver">
        <div className="resolver__content">
          <h1 className="resolver__heading">{renderHeading()}</h1>
          { hasData &&
            <div className="resolver__progress">
              <Progress
                value={state.currentMatchIndex + 1}
                max={matches.length}
                // active={isLoadingMatches}
              />
            </div>
          }
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  isLoadingMatches: PropTypes.bool,
  show: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onResolved: PropTypes.func.isRequired,
  resolveRequestId: PropTypes.string,
};

Resolver.defaultProps = {
  isLoadingMatches: true,
  show: false,
  matches: null,
  resolveRequestId: null,
};

export default Resolver;