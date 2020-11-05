import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Modal, Icon } from '@codaco/ui';
import { AnimatePresence, motion } from 'framer-motion';

const InfoWindow = ({ onClose, show, children, className }) => (
  <Modal show={show} onBlur={onClose}>
    <AnimatePresence>
      { show &&
        <motion.div
          className="info-window__container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cx('info-window', className)}
            layout
          >
            <button className="info-window__close" onClick={onClose}><Icon name="close" /></button>
            {children}
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>
  </Modal>
);

InfoWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

InfoWindow.defaultProps = {
  show: false,
  className: null,
};

export default InfoWindow;
