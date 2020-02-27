import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { get, last } from 'lodash';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import withApiClient from '../../components/withApiClient';
import Snapshot from './Snapshot';
import useEntityResolutionState from './useEntityResolutionState';
import NewSnapshot from './NewSnapshot';

const compareCreatedAt = (a, b) =>
  DateTime.fromISO(a.createdAt) - DateTime.fromISO(b.createdAt);

const EntityResolution = ({ apiClient, showError, protocolId, onUpdateOptions }) => {
  const [state, handlers] = useEntityResolutionState();

  const {
    enableEntityResolution,
    entityResolutionPath,
    selectedSnapshot,
    createNewSnapshot,
  } = state;

  const {
    toggleEntityResolution,
    selectSnapshot,
    setCreateNewSnapshot,
    changeEntityResolutionPath,
  } = handlers;

  const [resolutionHistory, setResolutionHistory] = useState([]);

  useEffect(() => {
    if (!protocolId) { return; }

    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions }) => {
        const sortedResolutions = [...resolutions].sort(compareCreatedAt);
        setResolutionHistory(sortedResolutions);
        selectSnapshot(null);
        // if path has been changed skip this
        if (entityResolutionPath.length === 0) {
          const path = get(last(sortedResolutions), 'options.entityResolutionPath', '');
          changeEntityResolutionPath(path);
        }
      })
      .catch(err => showError(err.message));
  }, [protocolId]);

  useEffect(() => {
    if (!onUpdateOptions) { return; }

    onUpdateOptions({
      enableEntityResolution,
      entityResolutionPath,
      selectedSnapshot,
      createNewSnapshot,
    });
  }, [
    enableEntityResolution,
    entityResolutionPath,
    selectedSnapshot,
    createNewSnapshot,
    onUpdateOptions,
  ]);

  return (
    <div className="export__section">
      <div className="export__subpanel">
        <h3>Entity Resolution</h3>
        <p>Use an external application to resolve nodes in a unified network.</p>
        <div className="export__subpanel-content">
          <Checkbox
            label="Enable entity resolution"
            input={{
              name: 'enable_entity_resolution', // TODO: is this necessary?
              checked: enableEntityResolution,
              onChange: toggleEntityResolution,
            }}
          />
        </div>
      </div>
      <div className="export__subpanel">
        <h4>Select resolution:</h4>
        <div className="export__subpanel-content">
          {
            resolutionHistory
              .map((snapshot, index) => (
                <Snapshot
                  key={snapshot.id}
                  onSelect={selectSnapshot}
                  onRollback={() => {}}
                  canRollback={resolutionHistory.length !== index + 1}
                  isSelected={state.selectedSnapshot === snapshot.id}
                  {...snapshot}
                />
              ))
          }
          <NewSnapshot
            onSelectCreateNewSnapshot={setCreateNewSnapshot}
            isSelected={createNewSnapshot}
            onChangeEntityResolutionPath={changeEntityResolutionPath}
            entityResolutionPath={entityResolutionPath}
          />
        </div>
      </div>
    </div>
  );
};

EntityResolution.propTypes = {
  show: PropTypes.bool.isRequired,
};

export default withApiClient(EntityResolution);
