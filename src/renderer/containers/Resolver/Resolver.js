import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner } from '@codaco/ui';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';

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

const Resolver = ({ entityCount, isLoadingMatches, matches, show }) => {
  const [state, onResolve] = useResolverState();

  const match = getMatch(matches, state.currentMatchIndex);
  const matchOrResolved = getMatchOrResolved(match, state.resolutions);

  return (
    <Modal show={show}>
      <div className="resolver">
        <Progress
          value={state.currentMatchIndex}
          max={entityCount}
          active={isLoadingMatches}
        />
        { !matchOrResolved &&
          <Spinner />
        }
        { matchOrResolved &&
          <EntityDiff
            match={matchOrResolved}
            onResolve={onResolve}
          />
        }
      </div>
    </Modal>
  );
};

Resolver.propTypes = {
  entityCount: PropTypes.number.isRequired,
  isLoadingMatches: PropTypes.bool,
  matches: PropTypes.array.isRequired,
  show: PropTypes.bool,
};

Resolver.defaultProps = {
  isLoadingMatches: true,
  show: true,
};

export default Resolver;
