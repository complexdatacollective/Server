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

const Resolver = ({ entityCount, isLoadingMatches, matches, show }) => {
  const [state, onResolve, onNext, onPrevious] = useResolverState();

  const currentMatch = getMatch(matches, state.currentMatchIndex);

  return (
    <Modal show={show}>
      <div className="resolver">
        <Progress
          value={state.currentMatchIndex}
          max={entityCount}
          active={isLoadingMatches}
        />
        { !currentMatch &&
          <Spinner />
        }
        { currentMatch &&
          <EntityDiff
            match={currentMatch}
            onResolve={onResolve}
            onNext={onNext}
            onPrevious={onPrevious}
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
