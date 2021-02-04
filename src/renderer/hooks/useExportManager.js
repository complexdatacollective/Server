import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Spinner, ProgressBar, Icon } from '@codaco/ui';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import useExportStatus from './useExportStatus';

const renderStatus = data => (
  <React.Fragment>
    <p>{data.statusText}</p>
    <ProgressBar orientation="horizontal" percentProgress={data.progress} />
  </React.Fragment>
);

const renderErrors = errors => (
  <div className="export-modal">
    <p>
      Your export completed, but non-fatal errors were encountered during the process. This
      may mean that not all sessions or all formats were able to be exported.
      Review the details of these errors below, and ensure that you check the data you
      received.
    </p>
    <h4>Errors:</h4>
    <ul className="export-modal__error-list">
      {errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  </div>
);

const EXPORT_UPDATE_TOAST = 'export-status-toast';
const EXPORT_COMPLETE_TOAST = 'export-complete-toast';

const useExportManager = () => {
  const dispatch = useDispatch();

  const { exportToFile, exportStatus, resetState, cancelExport } = useExportStatus();


  const handleExportFinished = (fatalError = false) => {
    dispatch(toastActions.removeToast(EXPORT_UPDATE_TOAST));

    if (fatalError) {
      return;
    }

    // If there were errors, show a dialog
    if (exportStatus.errors.length > 0) {
      dispatch(dialogActions.openDialog({
        type: 'Warning',
        title: 'Export finished, but with errors',
        message: renderErrors(exportStatus.errors),
        canCancel: false,
      }));

      return;
    }

    dispatch(toastActions.addToast({
      id: EXPORT_COMPLETE_TOAST,
      type: 'success',
      title: 'Export complete!',
      content: (
        <React.Fragment>
          <p>Your export finished successfully.</p>
        </React.Fragment>
      ),
    }));
  };

  const handleExportUpdate = () => {
    if (exportStatus.status === 'starting') {
      dispatch(toastActions.addToast({
        id: EXPORT_UPDATE_TOAST,
        type: 'info',
        title: 'Exporting...',
        autoDismiss: false,
        dismissHandler: cancelExport,
        CustomIcon: (<Spinner small />),
        content: renderStatus(exportStatus),
      }));
      return;
    }

    if (exportStatus.status === 'finished') {
      handleExportFinished();
      return;
    }

    const exportHasErrors = exportStatus.errors && exportStatus.errors.length > 0;

    dispatch(toastActions.updateToast(EXPORT_UPDATE_TOAST, {
      title: exportHasErrors ? 'Exporting (Non-fatal errors encountered)...' : 'Exporting...',
      CustomIcon: exportHasErrors ? (<Icon name="warning" />) : (<Spinner small />),
      content: renderStatus(exportStatus),
    }));
  };

  useEffect(() => {
    handleExportUpdate();
  }, [exportStatus.status, exportStatus.progress, exportStatus.errors]);

  const handleExportToFile = ( ...options) =>
    exportToFile(...options)
      .catch((e) => {
        handleExportFinished(true);
        resetState();
        throw e;
      });

  return { exportToFile: handleExportToFile, exportStatus };
};

export default useExportManager;
