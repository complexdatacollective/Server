import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Spinner } from '@codaco/ui';
import EntityDiff from './EntityDiff';
import useResolverState from './useResolverState';
import './Resolver.scss';

const Resolver = ({ entityCount, isLoadingMatches, matches, show }) => {
  const [state, onResolve, onNext, onPrevious] = useResolverState();

  const currentEntity = matches.length > state.currentEntityIndex + 1 &&
    matches[state.currentEntityIndex];

  return (
    <Modal show={show}>
      <div className="resolver">
        <Progress
          value={state.currentEntityIndex}
          max={entityCount}
          active={isLoadingMatches}
        />
        { !currentEntity &&
          <Spinner />
        }
        { currentEntity &&
          <EntityDiff
            entityA={currentEntity.a}
            entityB={currentEntity.b}
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
