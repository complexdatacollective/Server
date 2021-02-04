import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { get, find } from 'lodash';
import { Button } from '@codaco/ui';

const Resolution = ({
  id,
  date,
  onDelete,
  onExport,
  sessionCount,
  transformCount,
  options,
  nodeTypes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(s => !s);
  const displayDate = DateTime.fromISO(date).toHTTP();

  const egoCastType = get(options, 'egoCastType');

  const egoCastTypeLabel = get(find(nodeTypes, ['value', egoCastType]), 'label');

  return [
    <tr key="summary">
      <td><Button size="small" onClick={toggleOpen}>view more</Button></td>
      <td>{displayDate}</td>
      <td>{sessionCount}</td>
      <td>{transformCount}</td>
      <td>
        <div className="snapshot__delete">
          <Button onClick={() => onExport(id)} color="coral">Export</Button>
        </div>
      </td>
    </tr>,
    <tr key="parameters">
      <td colSpan="4" className="snapshot__parameters">
        <AnimatePresence>
          { isOpen &&
            <motion.div
              key="parameters-table"
              className="snapshot__parameters-container"
              layout
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table className="snapshot__parameters-table">
                <tbody>
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
                </tbody>
              </table>

              <Button onClick={() => onDelete(id)} color="tomato">Delete</Button>
            </motion.div>
          }
        </AnimatePresence>
      </td>
    </tr>,
  ];
};

Resolution.propTypes = {
  date: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onDelete: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  transformCount: PropTypes.number,
  sessionCount: PropTypes.number,
  options: PropTypes.object,
};

Resolution.defaultProps = {
  transformCount: 0,
  sessionCount: 0,
  options: {},
};

export default Resolution;
