/* eslint-disable no-underscore-dangle */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import { get, last } from 'lodash';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { motion } from 'framer-motion';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import withApiClient from '%components/withApiClient';
import { actionCreators as dialogActions } from '%modules/dialogs';
import { selectors } from '%modules/protocols';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import './EntityResolution.scss';

const compareCreatedAt = (a, b) =>
  DateTime.fromISO(a.createdAt) - DateTime.fromISO(b.createdAt);

const variants = {
  hide: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const EntityResolutionSettings = ({
  apiClient,
  showError,
  protocolId,
  resolveRequestId,
  enableEntityResolution,
  resolutionId,
  nodeTypes,
  createNewResolution,
  entityResolutionArguments,
  entityResolutionPath,
  onUpdateSetting,
  onSelectResolution,
  onSelectCreateNewResolution,
  openDialog,
}) => {
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [resolutionHistory, setResolutionHistory] = useState([]);

  const getResolutions = () => {
    if (!protocolId) { return; }

    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions, unresolved }) => {
        const sortedResolutions = [...resolutions].sort(compareCreatedAt);
        setResolutionHistory(sortedResolutions);
        setUnresolvedCount(unresolved);

        // if path/arguments have been changed skip this
        if (
          entityResolutionPath.length === 0 &&
          entityResolutionArguments.length === 0
        ) {
          const lastResolution = last(sortedResolutions);
          const lastEntityResolutionPath = get(lastResolution, 'parameters.entityResolutionPath', '');
          const lastEntityResolutionArguments = get(lastResolution, 'parameters.entityResolutionArguments', '');
          onUpdateSetting('entityResolutionPath', lastEntityResolutionPath);
          onUpdateSetting('entityResolutionArguments', lastEntityResolutionArguments);
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
    <motion.div
      className="entity-resolution"
      variants={variants}
      initial="hide"
      animate="show"
    >
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
                        key={resolution._id}
                        onSelect={onSelectResolution}
                        onDelete={handleDelete}
                        canDelete
                        isSelected={resolutionId === resolution._id}
                        id={resolution._id}
                        date={resolution._date}
                        sessionCount={resolution._sessionCount}
                        transformCount={resolution._transformCount}
                      />
                    ))
                }
                <NewSnapshot
                  nodeTypes={nodeTypes}
                  onSelectCreateNewResolution={onSelectCreateNewResolution}
                  isSelected={createNewResolution}
                  onUpdateSetting={onUpdateSetting}
                  entityResolutionPath={entityResolutionPath}
                  entityResolutionArguments={entityResolutionArguments}
                  newSessionCount={unresolvedCount}
                />
              </tbody>
            </table>
          </div>
        }
      </div>
    </motion.div>
  );
};

EntityResolutionSettings.propTypes = {
  apiClient: PropTypes.object.isRequired,
  createNewResolution: PropTypes.bool,
  enableEntityResolution: PropTypes.bool,
  entityResolutionArguments: PropTypes.string,
  entityResolutionPath: PropTypes.string,
  nodeTypes: PropTypes.array.isRequired,
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  onSelectResolution: PropTypes.func.isRequired,
  onUpdateSetting: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  resolutionId: PropTypes.string,
  resolveRequestId: PropTypes.string,
  showError: PropTypes.func.isRequired,
};

EntityResolutionSettings.defaultProps = {
  createNewResolution: false,
  enableEntityResolution: false,
  entityResolutionArguments: '',
  entityResolutionPath: '',
  protocolId: null,
  resolutionId: null,
  resolveRequestId: null,
};

const nodeDefinitionsAsOptions = nodeDefinitions =>
  Object.keys(nodeDefinitions).map(nodeType => ({
    label: nodeDefinitions[nodeType].name,
    value: nodeType,
  }));

const mapStateToProps = (state, props) => ({
  nodeTypes: nodeDefinitionsAsOptions(
    selectors.nodeDefinitions(state, props.protocolId),
  ),
});

const mapDispatchToProps = {
  openDialog: dialogActions.openDialog,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withApiClient,
)(EntityResolutionSettings);