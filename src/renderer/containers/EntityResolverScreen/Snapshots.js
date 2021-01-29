/* eslint-disable no-underscore-dangle */
import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import useResolutionsClient from '../../hooks/useResolutionsClient';
import { getNodeTypes } from './selectors';
import Snapshot from './Snapshot';
import './EntityResolution.scss';

const Snapshots = ({
  openDialog,
  protocolId,
}) => {
  const nodeTypes = useSelector(state => getNodeTypes(state, protocolId));
  const [{ resolutions }, { deleteResolution }] = useResolutionsClient(protocolId);

  const handleDelete = (rId) => {
    openDialog({
      type: 'Confirm',
      title: 'Remove Resolution(s)?',
      confirmLabel: 'Remove Resolution(s)',
      onConfirm: () => deleteResolution(rId),
      message: 'This will remove this resolution and also remove all subsequent resolutions.',
    });
  };

  const handleExport = (rId) => {
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
                <Snapshot
                  key={resolution._id}
                  onDelete={handleDelete}
                  canDelete
                  id={resolution._id}
                  nodeTypes={nodeTypes}
                  options={resolution.options}
                  date={resolution.date}
                  sessionCount={resolution._sessionCount}
                  transformCount={resolution.transformCount}
                />
              ))
          }
        </tbody>
      </table>
    </div>
  );
};

Snapshots.propTypes = {
  openDialog: PropTypes.func.isRequired,
  protocolId: PropTypes.string,
};

Snapshots.defaultProps = {
  protocolId: null,
};

export default Snapshots;
