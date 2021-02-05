import React from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { get, find } from 'lodash';
import cx from 'classnames';
import { Button } from '@codaco/ui';

const Resolution = ({
  id,
  date,
  isOpen,
  onOpen: handleOpen,
  onDelete,
  onExport,
  sessionCount,
  transformCount,
  options,
  nodeTypes,
}) => {
  const displayDate = DateTime.fromISO(date).toHTTP();

  const egoCastType = get(options, 'egoCastType');

  const egoCastTypeLabel = get(find(nodeTypes, ['value', egoCastType]), 'label');

  const summaryClasses = cx(
    'resolution__summary',
    { 'resolution__summary--is-open': isOpen }
  );

  const toggleClasses = cx(
    'resolution__toggle',
    { 'resolution__toggle--is-open': isOpen }
  );

  return [
    <tr key="summary" className={summaryClasses}>
      <td><div className={toggleClasses} onClick={handleOpen}>view more</div></td>
      <td>{displayDate}</td>
      <td>{sessionCount}</td>
      <td>{transformCount}</td>
      <td>
        <div className="resolution__delete">
          <Button onClick={() => onExport(id)} color="coral">Export</Button>
        </div>
      </td>
    </tr>,
    <tr key="parameters" className="resolution__parameters">
      <td colSpan="5">
        <AnimatePresence>
          { isOpen &&
            <motion.div
              key="parameters-container"
              className="resolution__parameters-container"
              layout
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <table className="resolution__parameters-table">
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
  onOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  transformCount: PropTypes.number,
  sessionCount: PropTypes.number,
  options: PropTypes.object,
};

Resolution.defaultProps = {
  transformCount: 0,
  sessionCount: 0,
  options: {},
  isOpen: false,
};

export default Resolution;
