/* eslint-disable no-underscore-dangle */
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimateSharedLayout } from 'framer-motion';
import PropTypes from 'prop-types';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { getNodeTypes } from './selectors';
import Resolution from './Resolution';
import './Resolutions.scss';

const Resolutions = ({
  protocolId,
  onDeleteResolution,
  onExportResolution,
  resolutions,
}) => {
  const dispatch = useDispatch();
  const nodeTypes = useSelector(state => getNodeTypes(state, protocolId));
  const openDialog = dialog => dispatch(dialogActions.openDialog(dialog));

  const [activeResolution, setActiveResolution] = useState(undefined);
  const toggleActiveResolution = (resolutionId) =>
    setActiveResolution(s => (s === resolutionId ? undefined : resolutionId));

  console.log({ activeResolution });

  const handleDelete = (resolutionId) => {
    openDialog({
      type: 'Confirm',
      title: 'Remove Resolution(s)?',
      confirmLabel: 'Remove Resolution(s)',
      onConfirm: () => onDeleteResolution(resolutionId),
      message: 'This will remove this resolution and also remove all subsequent resolutions.',
    });
  };

  return (
    <AnimateSharedLayout>
      <div className="resolutions">
        <table>
          <thead>
            <tr>
              <th>Resolution</th>
              <th>Date</th>
              <th>Included Sessions</th>
              <th>Resolve Count</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {
              resolutions
                .map(resolution => (
                  <Resolution
                    key={resolution.id}
                    isOpen={resolution.id === activeResolution}
                    onOpen={() => toggleActiveResolution(resolution.id)}
                    onDelete={handleDelete}
                    onExport={onExportResolution}
                    nodeTypes={nodeTypes}
                    {...resolution}
                  />
                ))
            }
          </tbody>
        </table>
      </div>
    </AnimateSharedLayout>
  );
};

Resolutions.propTypes = {
  protocolId: PropTypes.string,
  onDeleteResolution: PropTypes.func.isRequired,
  onExportResolution: PropTypes.func.isRequired,
  resolutions: PropTypes.array,
};

Resolutions.defaultProps = {
  protocolId: null,
  resolutions: [],
};

export default Resolutions;
