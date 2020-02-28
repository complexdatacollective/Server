import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner } from '@codaco/ui';
import ReviewTable from './ReviewTable';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';
import finializeResolutions from './finalizeResolutions';
import { getMatch, getMatchOrResolved } from './helpers';

const Resolver = ({ isLoadingMatches, matches, show, onResolved }) => {
  const [state, handlers] = useResolverState();

  const { resolveMatch, skipMatch } = handlers;

  const match = getMatch(matches, state.currentMatchIndex);
  const matchOrResolved = getMatchOrResolved(match, state.resolutions);

  const isComplete = !isLoadingMatches && state.currentMatchIndex >= matches.length;

  const handleFinish = () => {
    const resolutions = finializeResolutions(state.resolutions);
    onResolved(resolutions);
  };

  return (
    <Modal show={show}>
      <div className="resolver">
        <h1 className="resolver__heading">
          Match {state.currentMatchIndex + 1} of {matches.length}
        </h1>
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
            <ReviewTable matches={matches} actions={state.actions} />
            <button onClick={handleFinish}>Save</button>
          </div>
        }
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  isLoadingMatches: PropTypes.bool,
  matches: PropTypes.array.isRequired,
  show: PropTypes.bool,
  onResolved: PropTypes.func.isRequired,
};

Resolver.defaultProps = {
  isLoadingMatches: true,
  show: false,
};

export default Resolver;
