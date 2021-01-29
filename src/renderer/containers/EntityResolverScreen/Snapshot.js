import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { get, find } from 'lodash';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import { Button } from '@codaco/ui';

const Snapshot = ({
  id,
  date,
  onDelete,
  canDelete,
  sessionCount,
  transformCount,
  options,
  nodeTypes,
}) => {
  const [isSelected, setSelected] = useState(false);
  const toggleSelected = () => setSelected(s => !s);
  const displayDate = DateTime.fromISO(date).toHTTP();

  const egoCastType = get(options, 'egoCastType');

  const egoCastTypeLabel = get(find(nodeTypes, ['value', egoCastType]), 'label');

  return [
    <tr onClick={toggleSelected}>
      <td>{displayDate}</td>
      <td>{sessionCount}</td>
      <td>{transformCount}</td>
      <td>
        { canDelete &&
          <div className="snapshot__delete">
            <Button onClick={() => onDelete(id)} size="small" color="coral">Delete</Button>
          </div>
        }
      </td>
    </tr>,
    <tr>
      <td colSpan="4" className="snapshot__parameters">
        <AnimatePresence>
          { isSelected &&
            <motion.div
              key="parameters-table"
              className="snapshot__parameters-container"
              layout
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table className="snapshot__parameters-table">
                <tr>
                  <th>Node Type</th>
                  <td>{egoCastType} ({egoCastTypeLabel})</td>
                </tr>
                <tr>
                  <th>Interpreter Path</th>
                  <td>{get(options, 'interpreterPath')}</td>
                </tr>
                <tr>
                  <th>Resolver Script Path</th>
                  <td>{get(options, 'resolverPath')}</td>
                </tr>
                <tr>
                  <th>Resolver Script Arguments</th>
                  <td>{get(options, 'args')}</td>
                </tr>
              </table>
            </motion.div>
          }
        </AnimatePresence>
      </td>
    </tr>,
  ];
};

Snapshot.propTypes = {
  date: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onDelete: PropTypes.func.isRequired,
  canDelete: PropTypes.bool,
  transformCount: PropTypes.number,
  sessionCount: PropTypes.number,
  parameters: PropTypes.object,
};

Snapshot.defaultProps = {
  isSelected: false,
  canDelete: false,
  transformCount: 0,
  sessionCount: 0,
  parameters: {},
};

export default Snapshot;
