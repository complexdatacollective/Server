/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { get, last } from 'lodash';
import { connect } from 'react-redux';
import { compose } from 'redux';
import cx from 'classnames';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import withApiClient from '%components/withApiClient';
import { actionCreators as dialogActions } from '%modules/dialogs';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import './EntityResolution.scss';

const compareCreatedAt = (a, b) =>
  DateTime.fromISO(a.createdAt) - DateTime.fromISO(b.createdAt);

const EntityResolutionSettings = ({
  apiClient,
  showError,
  protocolId,
  resolveRequestId,
  enableEntityResolution,
  resolutionId, // TODO: what is this?
  createNewResolution,
  entityResolutionArguments,
  entityResolutionPath,
  onUpdateSetting,
  onSelectResolution,
  onSelectCreateNewResolution,
  disabled,
  openDialog,
}) => {
  const [resolutionHistory, setResolutionHistory] = useState([]);

  const getResolutions = () => {
    if (!protocolId) { return; }

    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions }) => {
        const sortedResolutions = [...resolutions].sort(compareCreatedAt);
        setResolutionHistory(sortedResolutions);
        onSelectResolution(null);
        // if path has been changed skip this
        if (entityResolutionPath.length === 0) {
          const path = get(last(sortedResolutions), 'options.entityResolutionPath', '');
          onUpdateSetting('entityResolutionPath', path);
        }
      })
      .catch(err => showError(err.message));
  };

  useEffect(() => {
    getResolutions();
  }, [protocolId, resolveRequestId]);

  const deleteResolution = (id) => {
    apiClient
      .delete(`/protocols/${protocolId}/resolutions/${id}`)
      .then((result) => {
        getResolutions();
        return result;
      })
      .then(({ ids }) => {
        openDialog({
          type: 'Notice',
          title: 'Resolution removed',
          confirmLabel: 'OK',
          message: `${ids.length} resolutions were removed.`,
        });
      })
      .catch(err => showError(err.message));
  };

  const handleDelete = (rId) => {
    openDialog({
      type: 'Confirm',
      title: 'Remove Resolution(s)?',
      confirmLabel: 'Remove Resolution(s)',
      onConfirm: () => deleteResolution(rId),
      message: 'This will remove this resolution and also remove all subsequent resolutions.',
    });
  };

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
              onChange: () => onUpdateSetting('enableEntityResolution', !enableEntityResolution),
              disabled,
            }}
          />
        </div>
        { enableEntityResolution &&
          <div className="export__subpanel">
            <table className="snapshots">
              <thead>
                <tr>
                  <th>Resolution</th>
                  <th>Sessions</th>
                  <th>Resolutions</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {
                  resolutionHistory
                    .map(resolution => (
                      <Snapshot
                        key={resolution._meta.id}
                        onSelect={onSelectResolution}
                        onDelete={handleDelete}
                        canDelete
                        isSelected={resolutionId === resolution._meta.id}
                        {...resolution._meta}
                      />
                    ))
                }
                <NewSnapshot
                  onSelectCreateNewResolution={onSelectCreateNewResolution}
                  isSelected={createNewResolution}
                  onUpdateSetting={onUpdateSetting}
                  entityResolutionPath={entityResolutionPath}
                  entityResolutionArguments={entityResolutionArguments}
                />
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
};

EntityResolutionSettings.propTypes = {
  apiClient: PropTypes.object.isRequired,
  showError: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  resolveRequestId: PropTypes.string,
  enableEntityResolution: PropTypes.bool,
  resolutionId: PropTypes.string,
  createNewResolution: PropTypes.bool,
  entityResolutionArguments: PropTypes.string,
  entityResolutionPath: PropTypes.string,
  onUpdateSetting: PropTypes.func.isRequired,
  onSelectResolution: PropTypes.func.isRequired,
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  openDialog: PropTypes.func.isRequired,
};

EntityResolutionSettings.defaultProps = {
  protocolId: null,
  resolveRequestId: null,
  disabled: false,
  resolutionId: null,
  enableEntityResolution: false,
  createNewResolution: false,
  entityResolutionArguments: '',
  entityResolutionPath: '',
};

const mapDispatchToProps = {
  openDialog: dialogActions.openDialog,
};

export default compose(
  connect(null, mapDispatchToProps),
  withApiClient,
)(EntityResolutionSettings);
