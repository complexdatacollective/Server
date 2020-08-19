import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators as messageActionCreators } from '%modules/appMessages';
import AdminApiClient from '%utils/adminApiClient';

const useAdminClient = () => {
  const client = useRef(new AdminApiClient());
  const dispatch = useDispatch();

  const showConfirmation = bindActionCreators(
    messageActionCreators.showConfirmationMessage,
    dispatch,
  );
  const showError = bindActionCreators(messageActionCreators.showErrorMessage, dispatch);

  const saveResolution = (protocol, exportSettings, resolution) => {
    if (!client.current) {
      return Promise.reject();
    }

    const {
      id: protocolId,
    } = protocol;


    console.log({ exportSettings, resolution });

    const {
      entityResolutionPath,
      entityResolutionArguments,
      egoCastType,
    } = exportSettings;

    const parameters = {
      entityResolutionPath,
      entityResolutionArguments,
      egoCastType,
    };

    console.log({ parameters });

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

  return {
    exportToFile,
    saveResolution,
  };
};

export default useAdminClient;
