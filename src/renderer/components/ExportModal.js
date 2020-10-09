import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import { Icon, Spinner, Modal, Button, ProgressBar, Scroller } from '@codaco/ui';
import { ipcRenderer } from 'electron';
import cx from 'classnames';

const initialState = {
  statusText: '',
  progress: 0,
  id: null,
  errors: [],
};

const ExportModal = ({
  className,
  show,
  onCancel,
  onComplete,
}) => {
  const [state, setState] = useState({
    ...initialState,
    show,
  });

  const handleExportStatus = useCallback((_, data) => {
    setState(s => ({ ...s, ...data }));
  }, [setState]);

  const handleExportError = useCallback((_, data) => {
    setState(s => ({ ...s, ...data }));
  }, [setState]);

  const handleCompleteExport = useCallback(() => {
    setState({ ...initialState, show: false });
    onComplete();
  }, [setState, onComplete]);

  // Cancelled from inside network-exporters
  const handleExportCancelled = useCallback(() => {
    setState({ ...initialState, show: false });
    onComplete();
  }, [setState, onComplete]);

  // Cancelled from UI
  const handleCancelExport = useCallback(() => {
    ipcRenderer.send('EXPORT/ABORT', state.id);
    setState({ ...initialState, show: false });
    onComplete();
  }, [setState, onComplete, state.id]);

  useEffect(() => {
    const unmount = () => {
      ipcRenderer.removeListener('EXPORT/BEGIN', handleExportStatus);
      ipcRenderer.removeListener('EXPORT/UPDATE', handleExportStatus);
      ipcRenderer.removeListener('EXPORT/ERROR', handleExportError);
      ipcRenderer.removeListener('EXPORT/FINISHED', handleExportStatus);
      ipcRenderer.removeListener('EXPORT/CANCELLED', handleExportCancelled);
    };

    if (!state.show) { unmount(); }

    ipcRenderer.on('EXPORT/BEGIN', handleExportStatus);
    ipcRenderer.on('EXPORT/UPDATE', handleExportStatus);
    ipcRenderer.on('EXPORT/ERROR', handleExportError);
    ipcRenderer.on('EXPORT/FINISHED', handleExportStatus);
    ipcRenderer.on('EXPORT/CANCELLED', handleExportCancelled);

    return unmount;
  }, [state.show]);

  // open when notified, but close using internal logic
  useEffect(() => {
    if (show !== true && state.show === true) { return; }
    setState(s => ({ ...s, show }));
  }, [show]);

  const classNames = cx('export-modal', className);

  const iconName = state.errors.length > 0 ? 'warning' : 'tick';

  const showErrors = state.errors.length > 0 && state.progress === 100;

  const renderErrors = (
    <div className="export-modal__status-detail">
      <h2>Export finished with errors.</h2>
      <p>
        Your export completed, but non-fatal errors were encountered during the process. This
        may mean that not all sessions or all formats were able to be exported.
        Review the details of these errors below, and ensure that you check the data you
        received.
      </p>
      <strong>Errors:</strong>
      <Scroller>
        <ul className="export-modal__error-list">
          {state.errors.map((error, index) => (
            <li key={index}><Icon name="warning" /> {error}</li>
          ))}
        </ul>
      </Scroller>
    </div>
  );

  const renderStatus = (
    <div className="export-modal__status-detail">
      <h2>{state.statusText}</h2>
      <ProgressBar orientation="horizontal" percentProgress={state.progress} />
    </div>
  );

  return (
    <Modal title="Exporting..." show={state.show} onCancel={handleCancelExport}>
      <div className={classNames}>
        <div className="export-modal__status">
          <div className="export-modal__status-icon">
            { state.progress === 100 ? (
              <Icon name={iconName} />
            ) : (
              <Spinner />
            )}
          </div>
          { showErrors ? renderErrors : renderStatus}
        </div>
        <div className="export-modal__controls">
          { state.progress === 100 ? (
            <Button onClick={handleCompleteExport}>Continue</Button>
          ) : (
            <Button
              color="platinum"
              onClick={handleCancelExport}
            >Cancel</Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

ExportModal.propTypes = {
  className: PropTypes.string,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func,
  show: PropTypes.bool,
};

ExportModal.defaultProps = {
  className: null,
  onCancel: noop,
  onComplete: noop,
  show: false,
};

export default ExportModal;
