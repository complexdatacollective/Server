import { useRef } from 'react';
import AdminApiClient from '../utils/adminApiClient';

const useAdminClient = () => {
  const client = useRef(new AdminApiClient());

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
