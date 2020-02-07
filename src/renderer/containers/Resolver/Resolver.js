import React, { useReducer } from 'react';
import Progress from '../../ui/components/Progress';
import { Modal } from '../../ui/components';
import EntityDiff from './EntityDiff';
import './Resolver.scss';

const initialState = {
  currentEntityIndex: 4,
};

const diffReducer = (state, action) => {
  switch (action.type) {
    default:
      throw new Error();
  }
};

const Resolver = ({ entityCount, isLoadingMatches, matches, show }) => {
  const [state, dispatch] = useReducer(diffReducer, initialState);


  const currentEntity = matches.length > state.currentEntityIndex + 1 &&
    matches[state.currentEntityIndex];

  return (
    <Modal show>
      <div className="resolver">
        <Progress
          value={state.currentEntityIndex}
          max={entityCount}
          active={isLoadingMatches}
        />
        { !currentEntity &&
          <div>LOADING</div>
        }
        { currentEntity &&
          <EntityDiff a={currentEntity.a} b={currentEntity.b} />
        }
      </div>
    </Modal>
  );
};

export default Resolver;
