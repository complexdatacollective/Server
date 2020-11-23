import { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from 'electron';
import { throttle } from 'lodash';
import useAdminClient from './useAdminClient';

const initialState = {
  status: 'idle', // finished, exporting, starting, idle
  statusText: '',
  progress: 0,
  id: null,
  errors: [],
};

const useExportStatus = () => {
  const { exportToFile } = useAdminClient();

  const [state, setState] = useState({
    ...initialState,
  });

  const resetState = useCallback(() => {
    setState({ ...initialState });
  }, [setState, state.id]);

  // Cancelled from UI
  const cancelExport = useCallback(() => {
    ipcRenderer.send('EXPORT/ABORT', state.id);
    resetState();
  }, [setState, state.id]);

  const handleStartExport = useCallback((_, data) => {
    setState(s => ({ ...s, ...data, status: 'starting' }));
  }, [setState]);

  const handleExportStatus = useCallback((_, data) => {
    setState(s => ({ ...s, ...data, status: 'exporting' }));
  }, [setState]);

  // Throttle errors here, rather than in network-exporters AdminService,
  // because we need immediate notification of errors - we just don't want
  // to cause render thrashing by rendering them.
  const handleExportError = throttle((_, data) => {
    setState(s => ({ ...s, errors: [...s.errors, data.error] }));
  }, 1000);

  const handleCompleteExport = useCallback((_, data) => {
    setState(s => ({ ...s, ...data, status: 'finished' }));
  }, [setState]);

  useEffect(() => {
    const unmount = () => {
      ipcRenderer.removeListener('EXPORT/BEGIN', handleStartExport);
      ipcRenderer.removeListener('EXPORT/UPDATE', handleExportStatus);
      ipcRenderer.removeListener('EXPORT/ERROR', handleExportError);
      ipcRenderer.removeListener('EXPORT/FINISHED', handleCompleteExport);
      ipcRenderer.removeListener('EXPORT/CANCELLED', resetState);
    };

    ipcRenderer.on('EXPORT/BEGIN', handleStartExport);
    ipcRenderer.on('EXPORT/UPDATE', handleExportStatus);
    ipcRenderer.on('EXPORT/ERROR', handleExportError);
    ipcRenderer.on('EXPORT/FINISHED', handleCompleteExport);
    ipcRenderer.on('EXPORT/CANCELLED', resetState);

    return unmount;
  }, []);

  return { exportToFile, exportStatus: state, cancelExport, resetState };
};

export default useExportStatus;
