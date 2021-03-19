import electron from 'electron';
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { throttle } from 'lodash';
import { motion } from 'framer-motion';
import cx from 'classnames';
import copy from '../images/copy.svg';

const { clipboard } = electron.remote;

const ClipboardText = ({
  showTag,
  className,
  children,
  clipboardText,
}) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  const showCopied = useRef();

  showCopied.current = throttle(() => {
    setCopied(true);

    if (timer.current) { clearTimeout(timer.current); }

    timer.current = setTimeout(() => setCopied(false), 899);
  }, 900);

  const text = clipboardText.toString().length === 0 ? children : clipboardText;

  const handleCopy = () => {
    clipboard.writeText(text.toString());
    showCopied.current();
  };

  const classes = cx('clipboard-text', className);

  const animations = {
    hide: { display: 'none' },
    copied: { display: 'block', opacity: [0, 0.9, 0], translateY: ['0%', '-150%'] },
  };

  return (
    <button
      className={classes}
      onClick={handleCopy}
    >
      <motion.span className="clipboard-text__text">
        {children}

        <motion.div
          initial="hide"
          variants={animations}
          transition={{ duration: 0.9 }}
          style={{ translateX: '-50%' }}
          animate={copied ? 'copied' : 'hide'}
          className="clipboard-text__copied"
        >
          {children}
        </motion.div>
      </motion.span>
      { showTag && <div className="clipboard-text__copy"><img src={copy} alt="copy" /></div> }
    </button>
  );
};

ClipboardText.propTypes = {
  showTag: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  clipboardText: PropTypes.string,
};

ClipboardText.defaultProps = {
  clipboardText: '',
  children: null,
  showTag: true,
  className: null,
};

export default ClipboardText;
