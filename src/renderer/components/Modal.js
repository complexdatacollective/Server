/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'network-canvas-ui/lib/components';
import { withRouter } from 'react-router-dom';

import { Modal as ModalTransition } from '../components/transitions';

/**
 * @class Modal
 * @description Renders a modal window compatible with React Router. Restores basePath on unmount
 */
function Modal(props) {
  const {
    children,
    className,
    close,
    history,
    match,
    show,
    title,
  } = props;

  const restorePath = () => {
    history.replace(`/${match.params.basePath || ''}`);
  };

  return (
    <ModalTransition in={show} onExited={restorePath}>
      <div key="modal" className={`modal ${className}`} onClick={() => close()}>
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
            <Button color="tomato" size="small" onClick={() => close()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </ModalTransition>
  );
}

Modal.propTypes = {
  className: PropTypes.string,
  close: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  show: PropTypes.bool,
  children: PropTypes.any,
};

Modal.defaultProps = {
  className: '',
  show: false,
  children: null,
};

export default withRouter(Modal);
