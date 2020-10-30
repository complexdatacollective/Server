import React from 'react';
import PropTypes from 'prop-types';
import { window } from '@codaco/ui';
import { AnimatePresence, motion } from 'framer-motion';

const InfoWindow = ({ onClose, show, children }) => (
  <AnimatePresence>
    { show &&
      <motion.div
        className="info-window"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button className="info-window__close" onClick={onClose}>x</button>
        {children}
      </motion.div>
    }
  </AnimatePresence>
);

InfoWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

InfoWindow.defaultProps = {
  show: false,
};

// export { InfoWindow };

export default window(InfoWindow);
