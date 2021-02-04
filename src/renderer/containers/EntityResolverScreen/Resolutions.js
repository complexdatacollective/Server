/* eslint-disable no-underscore-dangle */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { getNodeTypes } from './selectors';
import Resolution from './Resolution';
import './EntityResolution.scss';

const Resolutions = ({
  protocolId,
  onDeleteResolution,
  resolutions,
}) => {
  const dispatch = useDispatch();
  const nodeTypes = useSelector(state => getNodeTypes(state, protocolId));

  const openDialog = dialog => dispatch(dialogActions.openDialog(dialog));

  const handleDelete = (resolutionId) => {
    openDialog({
      type: 'Confirm',
      title: 'Remove Resolution(s)?',
      confirmLabel: 'Remove Resolution(s)',
      onConfirm: () => onDeleteResolution(resolutionId),
      message: 'This will remove this resolution and also remove all subsequent resolutions.',
    });
  };

  const handleExport = () => {
    // TODO
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
                <Resolution
                  key={resolution.id}
                  onDelete={handleDelete}
                  id={resolution.id}
                  nodeTypes={nodeTypes}
                  options={resolution.options}
                  date={resolution.date}
                  sessionCount={resolution.sessionCount}
                  transformCount={resolution.transformCount}
                />
              ))
          }
        </tbody>
      </table>
    </div>
  );
};

Resolutions.propTypes = {
  protocolId: PropTypes.string,
  onDeleteResolution: PropTypes.func.isRequired,
  resolutions: PropTypes.array,
};

Resolutions.defaultProps = {
  protocolId: null,
  resolutions: [],
};

export default Resolutions;
