import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { window, Icon } from '@codaco/ui';
import { AnimatePresence, motion } from 'framer-motion';

const InfoWindow = ({ onClose, show, children, className }) => (
  <AnimatePresence>
    { show &&
      <motion.div
        className={cx('info-window', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button className="info-window__close" onClick={onClose}><Icon name="close" /></button>
        {children}
      </motion.div>
    }
  </AnimatePresence>
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

export default window(InfoWindow);
