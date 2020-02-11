import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import Snapshot from './Snapshot';
import useEntityResolutionState, { actionCreators } from './useEntityResolutionState';
import NewSnapshot from './NewSnapshot';

const EntityResolution = () => {
  const [state, dispatch] = useEntityResolutionState();

  const snapshots = [
    { id: 1, date: '06/02/2020', sessions: 10, settings: { path: 'fwpwfp wfpwfp' } },
    { id: 2, date: '07/02/2020', sessions: 10, settings: { path: 'rstf pwfpwfp' } },
  ];

  const handleToggleEntityResolution = () =>
    dispatch(actionCreators.toggleEntityResolution());

  const handleCreateNewSnapshot = () =>
    dispatch(actionCreators.createNewSnapshot());

  const handleSelectSnapshot = snapshotId =>
    dispatch(actionCreators.selectSnapshot(snapshotId));

  return (
    <React.Fragment>
      <div className="export__section">
        <div className="export__subpanel">
          <h3>Entity Resolution</h3>
          <p>Use an external application to resolve nodes in a unified network.</p>
          <div className="export__subpanel-content">
            <Checkbox
              label="Enable entity resolution"
              input={{
                name: 'enable_entity_resolution', // TODO: is this necessary?
                checked: state.enableEntityResolution,
                onChange: handleToggleEntityResolution,
              }}
            />
          </div>
        </div>
        <div className="export__subpanel">
          <h4>Select resolution:</h4>
          <div className="export__subpanel-content">
            {snapshots.map((snapshot, index) => (
              <Snapshot
                key={snapshot.id}
                onSelect={handleSelectSnapshot}
                onRollback={() => {}}
                canRollback={snapshots.length !== index + 1}
                isSelected={state.selectedSnapshot === snapshot.id}
                {...snapshot}
              />
            ))}
            <NewSnapshot
              onSelectCreateNewSnapshot={handleCreateNewSnapshot}
              isSelected={state.createNewSnapshot}
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

EntityResolution.propTypes = {
  show: PropTypes.bool.isRequired,
};

export default EntityResolution;
