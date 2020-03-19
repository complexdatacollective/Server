import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner, Icon } from '@codaco/ui';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';
import finializeResolutions from './finalizeResolutions';
import { getMatch, getMatchOrResolved } from './helpers';

const Resolver = ({ isLoadingMatches, matches, show, onClose, onResolved, resolveRequestId }) => {
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

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    reset();
  }, [resolveRequestId]);

  // console.log('props', { isLoadingMatches, matches, show, onClose, onResolved, resolveRequestId });

  return (
    <Modal show={show} onBlur={handleClose}>
      <div className="resolver">
        <div
          className="resolver__close"
          onClick={handleClose}
        >
          <Icon name="close" size="small" />
        </div>
        <div className="resolver__content">
          { !isComplete &&
            <h1 className="resolver__heading">
              Match
              {hasData && ` ${state.currentMatchIndex + 1} of ${matches.length}`}
            </h1>
          }
          { isComplete && <h1 className="resolver__heading">Review Actions</h1> }
          <div className="resolver__progress">
            <Progress
              value={state.currentMatchIndex}
              max={matches.length}
              active={isLoadingMatches}
            />
          </div>
          { !isComplete && !matchOrResolved &&
            <div className="resolver__loading">
              <Spinner />
            </div>
          }
          { !isComplete && matchOrResolved &&
            <div className="resolver__diff">
              <EntityDiff
                match={matchOrResolved}
                onResolve={resolveMatch}
                onSkip={skipMatch}
              />
            </div>
          }
          { isComplete &&
            <div className="resolver__review">
              <ReviewTable
                matches={matches}
                actions={state.actions}
                onConfirm={handleFinish}
              />
            </div>
          }
          { !hasData && !isLoadingMatches &&
            <div>
              <Icon name="error" /> No data
            </div>
          }
        </div>
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  isLoadingMatches: PropTypes.bool,
  matches: PropTypes.array.isRequired,
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onResolved: PropTypes.func.isRequired,
  resolveRequestId: PropTypes.string,
};

Resolver.defaultProps = {
  isLoadingMatches: true,
  show: false,
  resolveRequestId: null,
};

export default Resolver;
