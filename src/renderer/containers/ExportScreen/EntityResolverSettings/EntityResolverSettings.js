/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { motion } from 'framer-motion';
import Toggle from '@codaco/ui/lib/components/Fields/Toggle';
import withApiClient from '../../../components/withApiClient';
import { actionCreators as dialogActions } from '../../../ducks/modules/dialogs';
import { selectors } from '../../../ducks/modules/protocols';
// import { actionCreators as messageActionCreators } from '../../../ducks/modules/appMessages';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import useResolutionsClient from './useResolutionsClient';
import './EntityResolution.scss';

const variants = {
  hide: { height: 0, opacity: 0 },
  show: { height: 'auto', opacity: 1 },
};

const initialState = {
  selectedResolution: null,
  options: {
    egoCastType: null,
    interpreterPath: 'python3',
    resolverPath: '',
    args: '',
  },
};

const EntityResolverSettings = ({
  apiClient,
  nodeTypes,
  onUpdate,
  openDialog,
  protocolId,
}) => {
  const [enabled, setEnabled] = useState(true);
  const toggleEnabled = () => setEnabled(s => !s);

  const [
    { resolutions, unresolved },
    { deleteResolution },
  ] = useResolutionsClient(apiClient, protocolId);

  const [state, setState] = useState({
    selectedResolution: '_new',
    options: {
      egoCastType: null,
      interpreterPath: 'python3',
      resolverPath: '/home/steve/Code/Clients/complexdatacollective/entity-resolution/Entity-Resolution-Sample/testing/Random.py',
      args: '',
    },
  });

  const updateState = (obj = {}) =>
    setState(s => ({ ...s, ...obj }));

  const updateOption = (option, value) => {
    const options = {
      ...state.options,
      [option]: value,
    };

    updateState({ options });
  };

  const updateSelected = (id = '_new') => {
    updateState({ selectedResolution: id });
  };

  useEffect(() => {
    if (enabled) { return; }
    setState(initialState);
  }, [enabled]);

  useEffect(() => {
    onUpdate(state);
  }, [JSON.stringify(state)]);

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
    <div className="entity-resolution">
      <Toggle
        label="Enable entity resolution"
        input={{
          value: enabled,
          onChange: toggleEnabled,
        }}
      />
      <motion.div
        className="entity-resolution"
        variants={variants}
        initial="hide"
        animate={enabled ? 'show' : 'hide'}
      >
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
              resolutions
                .map(resolution => (
                  <Snapshot
                    key={resolution._id}
                    onSelect={updateSelected}
                    onDelete={handleDelete}
                    canDelete
                    isSelected={state.selectedResolution === resolution._id}
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
              hasResolutionHistory={resolutions.length > 0}
              isSelected={state.selectedResolution === '_new'}
              newSessionCount={unresolved}
              nodeTypes={nodeTypes}
              onSelect={updateSelected}
              onUpdateOption={updateOption}
              options={state.options}
            />
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

EntityResolverSettings.propTypes = {
  apiClient: PropTypes.object.isRequired,
  nodeTypes: PropTypes.array.isRequired,
  openDialog: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
};

EntityResolverSettings.defaultProps = {
  protocolId: null,
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
  showError: () => {},
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withApiClient,
)(EntityResolverSettings);
