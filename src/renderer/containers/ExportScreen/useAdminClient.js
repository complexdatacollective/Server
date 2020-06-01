import { useRef } from 'react';
import AdminApiClient from '%utils/adminApiClient';

const useAdminClient = (showConfirmation, showError) => {
  const client = useRef(new AdminApiClient());

  const saveResolution = (protocol, exportSettings, resolution) => {
    if (!client.current) {
      return Promise.reject();
    }

    const {
      id: protocolId,
    } = protocol;

    const {
      entityResolutionPath,
      entityResolutionArguments,
    } = exportSettings;

    const parameters = {
      entityResolutionPath,
      entityResolutionArguments,
    };

    return client
      .current
      .post(`/protocols/${protocolId}/resolutions`, { parameters, resolution })
      .catch(err => showError(err.message));
  };

  const exportToFile = (protocol, exportSettings, destinationFilepath) => {
    if (!client.current) {
      return Promise.reject();
    }

    const {
      id: protocolId,
    } = protocol;

    const {
      exportFormat,
      exportNetworkUnion,
      csvTypes,
      useDirectedEdges,
      useEgoData,
      enableEntityResolution,
      resolutionId,
    } = exportSettings;

    const csvTypesNoEgo = new Set(exportSettings.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    const postBody = {
      enableEntityResolution,
      resolutionId,
      exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
      exportNetworkUnion,
      destinationFilepath,
      useDirectedEdges,
      useEgoData: useEgoData && showCsvOpts,
    };

    return client
      .current
      .post(`/protocols/${protocolId}/export_requests`, postBody)
      .then(() => showConfirmation('Export complete'))
      .catch(err => showError(err.message));
  };

  return [
    exportToFile,
    saveResolution,
  ];
};

export default useAdminClient;
