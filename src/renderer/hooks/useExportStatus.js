import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import { noop } from 'lodash';
import { useDispatch } from 'react-redux';
import { Icon, Spinner, Modal, Button, ProgressBar, Scroller } from '@codaco/ui';
import { actionCreators as toastActions } from '../ducks/modules/toasts';

const initialState = {
  statusText: '',
  progress: 0,
  id: null,
  errors: [],
};

const useExportStatus = ({
  onComplete,
}) => {
  const [state, setState] = useState({
    ...initialState,
  });

  const dispatch = useDispatch();

  const renderStatus = data => (
    <React.Fragment>
      <p>{data.statusText}</p>
      <ProgressBar orientation="horizontal" percentProgress={data.progress} />
    </React.Fragment>
  );

  // Cancelled from UI
  const handleCancelExport = useCallback(() => {
    ipcRenderer.send('EXPORT/ABORT', state.id);
    setState({ ...initialState });
  }, [setState, state.id]);

  const handleStartExport = useCallback((_, data) => {
    setState(s => ({ ...s, ...data }));
    dispatch(toastActions.addToast({
      id: 'export-status-toast',
      type: 'info',
      title: 'Exporting...',
      autoDismiss: false,
      dismissHandler: handleCancelExport,
      CustomIcon: (<Spinner small />),
      content: renderStatus(data),
    }));
  }, [setState]);

  const handleExportStatus = useCallback((_, data) => {
    setState(s => ({ ...s, ...data }));
    dispatch(toastActions.updateToast('export-status-toast', {
      content: renderStatus(data),
    }));
  }, [setState]);

  const handleExportError = useCallback((_, data) => {
    setState(s => ({ ...s, errors: [...s.errors, data.error] }));
  }, [setState]);

  const handleCompleteExport = useCallback(() => {
    setState({ ...initialState });
    dispatch(toastActions.removeToast('export-status-toast'));
    dispatch(toastActions.addToast({
      id: 'export-complete-toast',
      type: 'success',
      title: 'Export complete!',
      content: (
        <React.Fragment>
          <p>Your export finished successfully.</p>
        </React.Fragment>
      ),
    }));
  }, [setState]);

  // Cancelled from inside network-exporters
  const handleExportCancelled = useCallback(() => {
    setState({ ...initialState });
  }, [setState]);

  useEffect(() => {
    const unmount = () => {
      ipcRenderer.removeListener('EXPORT/BEGIN', handleStartExport);
      ipcRenderer.removeListener('EXPORT/UPDATE', handleExportStatus);
      ipcRenderer.removeListener('EXPORT/ERROR', handleExportError);
      ipcRenderer.removeListener('EXPORT/FINISHED', handleCompleteExport);
      ipcRenderer.removeListener('EXPORT/CANCELLED', handleExportCancelled);
    };

    ipcRenderer.on('EXPORT/BEGIN', handleStartExport);
    ipcRenderer.on('EXPORT/UPDATE', handleExportStatus);
    ipcRenderer.on('EXPORT/ERROR', handleExportError);
    ipcRenderer.on('EXPORT/FINISHED', handleCompleteExport);
    ipcRenderer.on('EXPORT/CANCELLED', handleExportCancelled);

    return unmount;
  }, []);

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
};

useExportStatus.propTypes = {
  onCancel: PropTypes.func,
};

useExportStatus.defaultProps = {
  onCancel: noop,
};

export default useExportStatus;
