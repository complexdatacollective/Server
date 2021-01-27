/* eslint-disable no-underscore-dangle */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { selectors } from '../../ducks/modules/protocols';
import Snapshot from './Snapshot';
import './EntityResolution.scss';

const Snapshots = ({
  resolutions,
  onDeleteSnapshot,
  nodeTypes,
  openDialog,
}) => {

  const handleDelete = (rId) => {
    openDialog({
      type: 'Confirm',
      title: 'Remove Resolution(s)?',
      confirmLabel: 'Remove Resolution(s)',
      onConfirm: () => onDeleteSnapshot(rId),
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
                  onDelete={handleDelete}
                  canDelete
                  id={resolution._id}
                  nodeTypes={nodeTypes}
                  parameters={resolution.parameters}
                  date={resolution._date}
                  sessionCount={resolution._sessionCount}
                  transformCount={resolution._transformCount}
                />
              ))
          }
        </tbody>
      </table>
    </div>
  );
};

Snapshots.propTypes = {
  resolutions: PropTypes.array,
  nodeTypes: PropTypes.array.isRequired,
  openDialog: PropTypes.func.isRequired,
  onDeleteSnapshot: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
};

Snapshots.defaultProps = {
  protocolId: null,
  resolutions: [],
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

export default compose(
  connect(mapStateToProps, {}),
)(Snapshots);
