/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/components';

import { Modal as ModalTransition } from '../components/Transitions';

/**
 * @class Modal
 * @description Renders a modal window compatible with React Router. Restores basePath on unmount
 */
function Modal(props) {
  const {
    closeWhenBackgroundClicked,
    children,
    className,
    onCancel,
    onComplete,
    show,
    title,
  } = props;

  let backgroundClickHandler = null;
  if (closeWhenBackgroundClicked) {
    backgroundClickHandler = onCancel || onComplete;
  }

  return (
    <ModalTransition in={show}>
      <div key="modal" className={`modal ${className}`} onClick={backgroundClickHandler}>
        <div className="modal__background" transition-role="background" />
        <div className="modal__window" transition-role="window" onClick={e => e.stopPropagation()}>
          <div className="modal__layout">
            <div className="modal__layout-title">
              <h1>{title}</h1>
            </div>
            <div className="modal__layout-content">
              {children}
            </div>
          </div>
          <div className="modal__close">
            {
              onCancel &&
              <Button color="tomato" size="small" onClick={() => onCancel()}>
                Cancel
              </Button>
            }
            {
              onComplete &&
              <Button size="small" onClick={() => onComplete()}>
                Finished
              </Button>
            }
          </div>
        </div>
      </div>
    </ModalTransition>
  );
}

Modal.propTypes = {
  closeWhenBackgroundClicked: PropTypes.bool,
  className: PropTypes.string,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func,
  title: PropTypes.string.isRequired,
  show: PropTypes.bool,
  children: PropTypes.any,
};

Modal.defaultProps = {
  closeWhenBackgroundClicked: false,
  className: '',
  onCancel: null,
  onComplete: null,
  show: false,
  children: null,
};

export default Modal;
