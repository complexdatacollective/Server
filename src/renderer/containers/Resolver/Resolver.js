import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner } from '@codaco/ui';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';
import finializeResolutions from './finalizeResolutions';

const getMatch = (matches, index) => {
  if (matches.length < index + 1) { return null; }

  return {
    ...matches[index],
    index,
  };
};

const getMatchOrResolved = (match, resolutions) => {
  if (!match) { return match; }

  const nodes = match.nodes.map((node) => {
    const resolution = resolutions.reverse()
      .find(r => r.nodes.includes(node.id));

    if (!resolution) { return node; }

    return {
      ...node,
      attributes: resolution.attributes,
    };
  });

  return {
    ...match,
    nodes,
  };
};

const Resolver = ({ isLoadingMatches, matches, show, onResolved }) => {
  const [state, onResolve] = useResolverState();

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
        <Progress
          value={state.currentMatchIndex}
          max={matches.length}
          active={isLoadingMatches}
        />
        { !isComplete && !matchOrResolved && <Spinner /> }
        { !isComplete && matchOrResolved &&
          <EntityDiff
            match={matchOrResolved}
            onResolve={onResolve}
          />
        }
        { isComplete && <button onClick={handleFinish}>Save</button> }
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  isLoadingMatches: PropTypes.bool,
  matches: PropTypes.array.isRequired,
  show: PropTypes.bool,
};

Resolver.defaultProps = {
  isLoadingMatches: false, // TODO: true
  show: false,
};

export default Resolver;
