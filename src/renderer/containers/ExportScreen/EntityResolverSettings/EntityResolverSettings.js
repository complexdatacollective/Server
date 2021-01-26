/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import withApiClient from '../../../components/withApiClient';
import { actionCreators as dialogActions } from '../../../ducks/modules/dialogs';
import { selectors } from '../../../ducks/modules/protocols';
// import { actionCreators as messageActionCreators } from '../../../ducks/modules/appMessages';
import Snapshot from './Snapshot';
import NewSnapshot from './NewSnapshot';
import useResolutionsClient from './useResolutionsClient';
import './EntityResolution.scss';

const EntityResolverSettings = ({
  apiClient,
  nodeTypes,
  onUpdate,
  openDialog,
  protocolId,
}) => {
  const [
    { resolutions, unresolved },
    { deleteResolution },
  ] = useResolutionsClient(apiClient, protocolId);

  const [state, setState] = useState({
    selectedResolution: null,
    options: {},
  });

  const updateState = (obj = {}) =>
    setState(s => ({ ...s, ...obj }));

  // const updateSettings = (newResolverSettings) => {
  //   updateState(newResolverSettings);
  //   onUpdate(newResolverSettings);
  // };

  const updateOption = (option, value) => {
    const options = {
      ...state.options,
      [option]: value,
    };

    updateState({ options });
  };

  const updateSelected = (id = '_new') => {
    console.log({ selectedResolution: id });
    updateState({ selectedResolution: id });
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
    <div className="entity-resolution">
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
    </div>
  );
};

EntityResolverSettings.propTypes = {
  apiClient: PropTypes.object.isRequired,
  nodeTypes: PropTypes.array.isRequired,
  openDialog: PropTypes.func.isRequired,
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
