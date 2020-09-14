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
import { actionCreators as messageActionCreators } from '%modules/appMessages';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import './EntityResolution.scss';

const compareCreatedAt = (a, b) =>
  DateTime.fromISO(a.createdAt) - DateTime.fromISO(b.createdAt);

const variants = {
  hide: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const EntityResolverSettings = ({
  apiClient,
  createNewResolution,
  enableEntityResolution,
  resolverOptions,
  nodeTypes,
  onSelectCreateNewResolution,
  onSelectResolution,
  onUpdateSetting,
  onUpdateOptions,
  openDialog,
  protocolId,
  resolutionId,
  resolverActive,
  showError,
}) => {
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [resolutionHistory, setResolutionHistory] = useState([]);

  const updateResolverOption = (option, value) =>
    onUpdateOptions({ ...resolverOptions, [option]: value });

  const getResolutions = () => {
    if (!protocolId) { return; }

    apiClient
      .get(`/protocols/${protocolId}/resolutions`)
      .then(({ resolutions, unresolved }) => {
        const sortedResolutions = [...resolutions].sort(compareCreatedAt);
        setResolutionHistory(sortedResolutions);
        setUnresolvedCount(unresolved);

        console.log({ resolutions });

        const lastResolution = last(sortedResolutions);
        const lastParameters = get(lastResolution, 'parameters', {});

        const nextResolverOptions = {
          ...resolverOptions,
          ...lastParameters,
        };

        // if path/arguments have been changed skip this
        onUpdateOptions(nextResolverOptions);
      })
      .catch(err => showError(err.message));
  };

  useEffect(() => {
    if (resolverActive === false) {
      getResolutions();
    }
  }, [resolverActive]);

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
                        nodeTypes={nodeTypes}
                        parameters={resolution.parameters}
                        date={resolution._date}
                        sessionCount={resolution._sessionCount}
                        transformCount={resolution._transformCount}
                      />
                    ))
                }
                <NewSnapshot
                  hasResolutionHistory={resolutionHistory.length > 0}
                  isSelected={createNewResolution}
                  newSessionCount={unresolvedCount}
                  nodeTypes={nodeTypes}
                  onSelectCreateNewResolution={onSelectCreateNewResolution}
                  onUpdateOption={updateResolverOption}
                  options={resolverOptions}
                />
              </tbody>
            </table>
          </div>
        }
      </div>
    </motion.div>
  );
};

EntityResolverSettings.propTypes = {
  apiClient: PropTypes.object.isRequired,
  createNewResolution: PropTypes.bool,
  enableEntityResolution: PropTypes.bool,
  nodeTypes: PropTypes.array.isRequired,
  onSelectCreateNewResolution: PropTypes.func.isRequired,
  onSelectResolution: PropTypes.func.isRequired,
  onUpdateOptions: PropTypes.func.isRequired,
  onUpdateSetting: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
  resolutionId: PropTypes.string,
  resolverActive: PropTypes.bool,
  resolverOptions: PropTypes.shape({
    args: PropTypes.string,
    egoCastType: PropTypes.string,
    interpreterPath: PropTypes.string,
    resolverPath: PropTypes.string,
  }),
  showError: PropTypes.func.isRequired,
};

EntityResolverSettings.defaultProps = {
  createNewResolution: false,
  enableEntityResolution: false,
  protocolId: null,
  resolutionId: null,
  resolverActive: false,
  resolverOptions: {},
};

const nodeDefinitionsAsOptions = (nodeDefinitions) => {
  const options = Object.keys(nodeDefinitions)
    .map(nodeType => ({
      label: nodeDefinitions[nodeType].name,
      value: nodeType,
    }));

  return options;
};

const mapStateToProps = (state, props) => ({
  nodeTypes: nodeDefinitionsAsOptions(
    selectors.nodeDefinitions(state, props.protocolId),
  ),
});

const mapDispatchToProps = {
  openDialog: dialogActions.openDialog,
  showError: messageActionCreators.showErrorMessage,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withApiClient,
)(EntityResolverSettings);
