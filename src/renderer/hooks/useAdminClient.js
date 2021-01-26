import { useRef } from 'react';
import AdminApiClient from '../utils/adminApiClient';
import useResolver from './useResolver';

const useAdminClient = () => {
  const client = useRef(new AdminApiClient());
  const [resolverState, resolveProtocol, abortResolution] = useResolver();

  const exportToFile = (protocol, exportOptions) => {
    if (!client.current) {
      return Promise.reject();
    }

    const {
      id: protocolId,
    } = protocol;

    // TODO: if resolver enabled, use IPC.
    if (exportOptions.resolveEntities !== false) {
      console.log({ exportOptions }, 'ipc');
      resolveProtocol(protocol, exportOptions);
      return Promise.resolve();
    }

    return client
      .current
      .post(`/protocols/${protocolId}/export_requests`, exportOptions);
  };

  return {
    exportToFile,
  };
};

export default useAdminClient;
