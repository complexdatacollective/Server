import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import withApiClient from '../../components/withApiClient';
import Snapshot from './Snapshot';
import useEntityResolutionState, { actionCreators } from './useEntityResolutionState';
import NewSnapshot from './NewSnapshot';

const EntityResolution = ({ apiClient, showError, protocolId }) => {
  const [state, dispatch] = useEntityResolutionState();

  const [resolutionHistory, setResolutionHistory] = useState([
    { id: 1, date: '06/02/2020', sessions: 10, settings: { path: 'fwpwfp wfpwfp' } },
    { id: 2, date: '07/02/2020', sessions: 10, settings: { path: 'rstf pwfpwfp' } },
  ]);

  console.log(resolutionHistory);

  useEffect(() => {
    if (!protocolId) { return; }
    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions }) => setResolutionHistory(resolutions))
      .catch(err => showError(err.message));
  }, [protocolId]);

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
            {resolutionHistory.map((snapshot, index) => (
              <Snapshot
                key={snapshot.id}
                onSelect={handleSelectSnapshot}
                onRollback={() => {}}
                canRollback={resolutionHistory.length !== index + 1}
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

export default withApiClient(EntityResolution);
