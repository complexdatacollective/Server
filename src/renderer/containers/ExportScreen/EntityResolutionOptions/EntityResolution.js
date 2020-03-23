/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { get, last } from 'lodash';
import cx from 'classnames';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import DrawerTransition from '@codaco/ui/lib/components/Transitions/Drawer';
import withApiClient from '%components/withApiClient';
import useEntityResolutionState from './useEntityResolutionState';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import './EntityResolution.scss';

const compareCreatedAt = (a, b) =>
  DateTime.fromISO(a.createdAt) - DateTime.fromISO(b.createdAt);

const EntityResolution = ({
  apiClient,
  showError,
  protocolId,
  resolveRequestId,
  onUpdateOptions,
  disabled,
}) => {
  const [state, handlers] = useEntityResolutionState();

  const {
    enableEntityResolution,
    entityResolutionPath,
    minimumThreshold,
    resolutionId,
    createNewResolution,
  } = state;

  const {
    toggleEntityResolution,
    selectResolution,
    setCreateNewResolution,
    changeResolutionOptions,
  } = handlers;

  const [resolutionHistory, setResolutionHistory] = useState([]);

  useEffect(() => {
    if (!protocolId) { return; }

    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions }) => {
        const sortedResolutions = [...resolutions].sort(compareCreatedAt);
        setResolutionHistory(sortedResolutions);
        selectResolution(null);
        // if path has been changed skip this
        if (entityResolutionPath.length === 0) {
          const path = get(last(sortedResolutions), 'options.entityResolutionPath', '');
          changeResolutionOptions({ entityResolutionPath: path });
        }
      })
      .catch(err => showError(err.message));
  }, [protocolId, resolveRequestId]);

  useEffect(() => {
    if (!onUpdateOptions) { return; }

    onUpdateOptions({
      enableEntityResolution,
      entityResolutionPath,
      minimumThreshold,
      resolutionId,
      createNewResolution,
    });
  }, [
    enableEntityResolution,
    entityResolutionPath,
    minimumThreshold,
    resolutionId,
    createNewResolution,
    onUpdateOptions,
  ]);

  return (
    <div className={cx('entity-resolution', { 'entity-resolution--disabled': disabled })}>
      <div className="export__section">
        <h3>Entity Resolution</h3>
        <p>Use an external application to resolve nodes in a unified network.</p>
        <div className="export__subpanel-content">
          <Checkbox
            label="Enable entity resolution"
            input={{
              name: 'enable_entity_resolution', // TODO: is this necessary?
              checked: enableEntityResolution,
              onChange: toggleEntityResolution,
              disabled,
            }}
          />
        </div>
        { enableEntityResolution &&
          <div className="export__subpanel">
            <h4>Select resolution:</h4>
            <div className="export__subpanel-content">
              {
                resolutionHistory
                  .map((resolution, index) => (
                    <Snapshot
                      key={resolution._meta.id}
                      onSelect={selectResolution}
                      onRollback={() => {}}
                      canRollback={resolutionHistory.length !== index + 1}
                      isSelected={state.resolutionId === resolution._meta.id}
                      {...resolution._meta}
                    />
                  ))
              }
              <NewSnapshot
                onSelectCreateNewSnapshot={setCreateNewResolution}
                isSelected={createNewResolution}
                onChangeOptions={changeResolutionOptions}
                options={{
                  entityResolutionPath,
                  minimumThreshold,
                }}
              />
            </div>
          </div>
        }
      </div>
    </div>
  );
};

EntityResolution.propTypes = {
  apiClient: PropTypes.object.isRequired,
  showError: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  resolveRequestId: PropTypes.string,
  onUpdateOptions: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

EntityResolution.defaultProps = {
  protocolId: null,
  resolveRequestId: null,
  disabled: false,
};

export default withApiClient(EntityResolution);
