import React, { useReducer } from 'react';
import { reduce } from 'lodash';
import Checkbox from '../ui/components/Fields/Checkbox';
import DrawerTransition from '../ui/components/Transitions/Drawer';

const Snapshot = ({ date }) => (
  <div className="snapshot">
    {date}
  </div>
);

const entityResolutionInitialState = {
  enableEntityResolution: false,
  selectedSnapshot: null,
  createNewSnapshot: false,
};

const entityResolutionActions = {
  toggleEntityResolution: 'TOGGLE_ENTITY_RESOLUTION',
  selectSnapshot: 'SELECT_SNAPSHOT',
  createNewSnapshot: 'CREATE_NEW_SNAPSHOT',
};

const entityResolutionReducer = actionTypes =>
  (state, action) => {
    const payload = action.payload || {};

    switch (action.type) {
      case actionTypes.toggleEntityResolution:
        return { ...state, enableEntityResolution: !state.enableEntityResolution };
      case actionTypes.selectSnapshot:
        return { ...state, selectSnapshot: payload.snapshot, createNewSnapshot: false };
      case actionTypes.createNewSnapshot:
        return { ...state, selectSnapshot: null, createNewSnapshot: false };
      default:
        throw new Error();
    }
  };

const useEntityResolutionState = (reducer, initialState, actionTypes) => {
  const [state, dispatch] = useReducer(reducer(actionTypes), initialState);

  const actions = reduce(
    actionTypes,
    (memo, type, key) => ({
      ...memo,
      [key]: payload => dispatch({ type, payload }),
    }),
    {},
  );

  return [state, actions];
};

const EntityResolution = ({ show }) => {
  const [state, actions] = useEntityResolutionState(
    entityResolutionReducer,
    entityResolutionInitialState,
    entityResolutionActions,
  );

  const snapshots = [
    { id: 0, date: '06/02/2020', sessions: 10 },
    { id: 0, date: '07/02/2020', sessions: 10 },
  ];

  return (
    <div className="export__section">
      <DrawerTransition in={show}>
        <div className="export__subpanel">
          <h3>Entity Resolution</h3>
          <div className="export__subpanel-content">
            <Checkbox
              label="Enable entity resolution"
              input={{
                name: 'enable_entity_resolution', // TODO: is this necessary?
                checked: state.enableEntityResolution,
                onChange: () => actions.toggleEntityResolution(),
              }}
            />
          </div>
          <DrawerTransition in={state.enableEntityResolution}>
            <div className="export__subpanel-content">
              {snapshots.map(snapshot => (
                <Snapshot
                  selected={state.selectedSnapshot === snapshot.id}
                  {...snapshot}
                />
              ))}
              <div
                className="snapshot"
                selected={state.createNewSnapshot}
              >
                new snapshot
              </div>
            </div>
          </DrawerTransition>
        </div>
      </DrawerTransition>
    </div>
  );
};

export default EntityResolution;
