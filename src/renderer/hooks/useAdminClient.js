import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';
import AdminApiClient from '../utils/adminApiClient';

const useAdminClient = () => {
  const client = useRef(new AdminApiClient());
  const dispatch = useDispatch();

  const showConfirmation = bindActionCreators(
    messageActionCreators.showConfirmationMessage,
    dispatch,
  );

  const showError = bindActionCreators(messageActionCreators.showErrorMessage, dispatch);

  const exportToFile = (protocol, exportOptions) => {
    if (!client.current) {
      return Promise.reject();
    }

    const {
      id: protocolId,
    } = protocol;

    return client
      .current
      .post(`/protocols/${protocolId}/export_requests`, exportOptions)
      .catch(err => showError(err.message))
      .then((result) => {
        console.log({ result });
        // showConfirmation('Export complete');
      });
  };

  return {
    exportToFile,
  };
};

export default useAdminClient;
