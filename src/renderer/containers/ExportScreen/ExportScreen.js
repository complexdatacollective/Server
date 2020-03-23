import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect, withRouter } from 'react-router-dom';
import { remote } from 'electron';
import { compose } from 'recompose';
import { get } from 'lodash';
import uuid from 'uuid';
import { Button, Spinner } from '@codaco/ui';
import DrawerTransition from '@codaco/ui/lib/components/Transitions/Drawer';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import Radio from '@codaco/ui/lib/components/Fields/Radio';
import Toggle from '@codaco/ui/lib/components/Fields/Toggle';
import Types from '%renderer/types';
import ErrorBoundary from '%components/ErrorBoundary';
import ExportModal from '%components/ExportModal';
import withApiClient from '%components/withApiClient';
import withResolverClient from '%components/withResolverClient';
import { selectors } from '%modules/protocols';
import { actionCreators as messageActionCreators } from '%modules/appMessages';
import EntityResolutionOptions from './EntityResolutionOptions';
import Resolver from './Resolver';

const availableCsvTypes = {
  adjacencyMatrix: 'Adjacency Matrix',
  attributeList: 'Attribute List',
  edgeList: 'Edge List',
};

const initialState = {
  exportFormat: 'csv',
  exportNetworkUnion: false,
  csvTypes: new Set([...Object.keys(availableCsvTypes), 'ego']),
  useDirectedEdges: true,
  useEgoData: true,
  resolveRequestId: null,
  matches: [],
  showResolver: false,
  isLoadingMatches: false,
  errorLoadingMatches: null,
  entityResolutionOptions: {},
};

const ExportScreen = ({
  apiClient,
  resolverClient,
  protocol,
  protocolsHaveLoaded,
  history,
  showConfirmation,
  showError,
}) => {
  const resolverStream = useRef();

  const [state, setState] = useState(initialState);

  const mergeState = props => setState(s => ({ ...s, ...props }));

  if (!protocol) { return null; }

  const { id: protocolId } = protocol;

  const cleanupResolverStream = () => {
    if (resolverStream.current) {
      resolverStream.current.abort();
      resolverStream.current = null;
    }
  };

  const resetResolver = () => {
    setState(s => ({
      ...s,
      matches: [],
      isLoadingMatches: false,
      showResolver: false,
      errorLoadingMatches: null,
    }));

    cleanupResolverStream();
  };

  const exportToFile = (destinationFilepath) => {
    if (!apiClient) {
      return;
    }

    const {
      exportFormat,
      exportNetworkUnion,
      csvTypes,
      useDirectedEdges,
      useEgoData,
      entityResolutionOptions,
    } = state;

    const csvTypesNoEgo = new Set(state.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    apiClient
      .post(`/protocols/${protocolId}/export_requests`, {
        entityResolutionOptions,
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        destinationFilepath,
        useDirectedEdges,
        useEgoData: useEgoData && showCsvOpts,
      })
      .then(() => showConfirmation('Export complete'))
      .catch(err => showError(err.message))
      .then(() => mergeState({ exportInProgress: false }));
  };

  const promptAndExport = () => {
    const defaultName = protocol.name || 'network-canvas-data';
    const exportDialog = {
      title: 'Export ',
      filters: [{
        name: `${defaultName}-export`,
        // TODO: support exporting a single graphml file
        extensions: ['zip'],
      }],
    };

    remote.dialog.showSaveDialog(exportDialog, (filepath) => {
      if (filepath) {
        mergeState(
          { exportInProgress: true },
          () => exportToFile(filepath),
        );
      }
    });
  };

  const formatsAreValid = () =>
    state.exportFormat === 'graphml' || state.csvTypes.size > 0;

  const resolveProtocol = () => {
    if (!resolverClient) { return Promise.reject(); }

    const requestId = uuid();

    const {
      exportFormat,
      exportNetworkUnion,
      csvTypes,
      useDirectedEdges,
      useEgoData,
      entityResolutionOptions,
    } = state;

    const csvTypesNoEgo = new Set(state.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    setState(s => ({
      ...s,
      showResolver: true,
      resolveRequestId: requestId,
      matches: [],
      isLoadingMatches: true,
      errorLoadingMatches: null,
    }));

    return resolverClient.resolveProtocol(
      protocolId,
      {
        entityResolutionOptions,
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        useDirectedEdges,
        useEgoData: useEgoData && showCsvOpts,
      },
    )
      .then(newResolverStream => new Promise((resolve, reject) => {
        resolverStream.current = newResolverStream;

        newResolverStream.on('data', (d) => {
          const data = JSON.parse(d.toString());
          setState(s => ({ ...s, matches: [...s.matches, data] }));
        });

        newResolverStream.on('end', resolve);

        newResolverStream.on('error', reject);
      }))
      .then(() => {
        setState(s => ({
          ...s,
          isLoadingMatches: false,
        }));
      })
      .catch((error) => {
        showError(error.message);

        setState(s => ({
          ...s,
          isLoadingMatches: false,
          errorLoadingMatches: error,
          showResolver: false,
        }));
      })
      .finally(cleanupResolverStream);
  };

  const saveResolution = (resolution) => {
    const {
      entityResolutionOptions: { entityResolutionPath },
    } = state;

    if (!apiClient) {
      return Promise.reject();
    }

    const options = {
      entityResolutionPath,
    };

    return apiClient
      .post(`/protocols/${protocolId}/resolutions`, { options, resolution })
      .then(({ resolutionId }) => {
        setState(s => ({
          ...s,
          resolveRequestId: null,
          entityResolutionOptions: {
            ...state.entityResolutionOptions,
            resolutionId,
            createNewResolution: false,
          },
        }));
      })
      .then(() => promptAndExport())
      .catch(err => showError(err.message));
  };


  const handleFormatChange = (evt) => {
    const exportFormat = evt.target.value;
    mergeState({ exportFormat });
  };

  const handleCsvTypeChange = (evt) => {
    const csvTypes = new Set(state.csvTypes);
    if (evt.target.checked) {
      csvTypes.add(evt.target.value);
    } else {
      csvTypes.delete(evt.target.value);
    }
    mergeState({ csvTypes });
  };

  const handleUnionChange = (evt) => {
    mergeState({ exportNetworkUnion: evt.target.value === 'true' });
  };

  const handleDirectedEdgesChange = (evt) => {
    mergeState({ useDirectedEdges: evt.target.checked });
  };

  const handleEgoDataChange = (evt) => {
    mergeState({ useEgoData: evt.target.checked });
  };

  const handleUpdateEntityResolutionOptions = (entityResolutionOptions) => {
    setState(s => ({ ...s, entityResolutionOptions }));
  };

  const handleResolved = (resolutions) => {
    saveResolution(resolutions)
      .then(resetResolver);
  };

  const handleCancelResolver = () => {
    resetResolver();
  };

  const handleSubmit = () => {
    if (!formatsAreValid()) {
      showError('Please select at least one file type to export');
      return;
    }

    const createNewResolution = get(
      state,
      'entityResolutionOptions.createNewResolution',
      false,
    );

    if (createNewResolution) {
      resolveProtocol();
      return;
    }

    promptAndExport();
  };

  const handleCancel = () => {
    // setState({ exportInProgress: false });
    // TODO: cancel underlying requests with an AbortController (requires Electron 3+)
    // Temporary workaround:
    remote.getCurrentWindow().reload();
  };

  if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocol) { // This protocol hasn't loaded yet
    return <div className="settings--loading"><Spinner /></div>;
  }

  const showCsvOpts = state.exportFormat === 'csv';
  const { exportInProgress } = state;

  return (
    <form className="export" onSubmit={handleSubmit}>
      <ExportModal
        className="modal--export"
        show={exportInProgress}
        handleCancel={handleCancel}
      />
      {/* <ErrorBoundary>
        <Resolver
          key={state.resolveRequestId}
          matches={state.matches}
          isLoadingMatches={state.isLoadingMatches}
          show={state.showResolver}
          onCancel={handleCancelResolver}
          onResolved={handleResolved}
        />
      </ErrorBoundary> */}
      <h1>Export Data {state.resolveRequestId}</h1>
      <div className="export__section">
        <h3>File Type</h3>
        <p>
          Choose an export format. If multiple files are produced, they’ll be archived in a ZIP
          for download.
        </p>
        <div>
          <Radio
            label="GraphML"
            input={{
              name: 'export_format',
              checked: state.exportFormat === 'graphml',
              value: 'graphml',
              onChange: handleFormatChange,
            }}
          />
        </div>
        <div>
          <Radio
            label="CSV"
            input={{
              name: 'export_format',
              checked: state.exportFormat === 'csv',
              value: 'csv',
              onChange: handleFormatChange,
            }}
          />
        </div>
        <div className="export__csv-types">
          <Toggle
            disabled={state.exportFormat === 'graphml'}
            label="Include Ego data?"
            input={{
              name: 'export_ego_data',
              onChange: handleEgoDataChange,
              value: state.exportFormat === 'csv' && state.useEgoData,
            }}
          />
          <DrawerTransition in={!showCsvOpts}>
            <div className="export__ego-info">* Ego data not supported for this export format. See <a className="external-link" href="https://documentation.networkcanvas.com/docs/tutorials/server-workflows/#managing-and-exporting-data-in-server">documentation</a>.</div>
          </DrawerTransition>
        </div>
        <DrawerTransition in={showCsvOpts}>
          <div className="export__subpanel">
            <div className="export__subpanel-content">
              <h4>Include the following files:</h4>
              {
                Object.entries(availableCsvTypes).map(([csvType, label]) => (
                  <div key={`export_csv_type_${csvType}`}>
                    <Checkbox
                      label={label}
                      input={{
                        name: 'export_csv_types',
                        checked: state.csvTypes.has(csvType),
                        value: csvType,
                        onChange: handleCsvTypeChange,
                      }}
                    />
                  </div>
                ))
              }
              <DrawerTransition in={state.useEgoData}>
                <div key="export_csv_type_ego">
                  <Checkbox
                    label="Ego Attribute List"
                    input={{
                      name: 'export_ego_attributes',
                      checked: state.csvTypes.has('ego'),
                      value: 'ego',
                      onChange: handleCsvTypeChange,
                    }}
                  />
                </div>
              </DrawerTransition>
            </div>
          </div>
        </DrawerTransition>
      </div>
      <div className="export__section">
        <h4>Directed Edges</h4>
        <Toggle
          label="Treat edges as directed"
          input={{
            name: 'export_use_directed_edges',
            onChange: handleDirectedEdgesChange,
            value: state.useDirectedEdges,
          }}
        />
      </div>
      <div className="export__section">
        <h3>Interview Networks</h3>
        <p>
          Choose whether to export all networks separately, or to merge them
          before exporting.
        </p>
        <div>
          <Radio
            label="Export the network from each interview separately"
            input={{
              name: 'export_network_union',
              checked: state.exportNetworkUnion === false,
              value: 'false',
              onChange: handleUnionChange,
            }}
          />
        </div>
        <div>
          <Radio
            label="Export the union of all interview networks"
            input={{
              name: 'export_network_union',
              checked: state.exportNetworkUnion === true,
              value: 'true',
              onChange: handleUnionChange,
            }}
          />
        </div>
      </div>
      {/* <ErrorBoundary>
        <EntityResolutionOptions
          resolveRequestId={state.resolveRequestId}
          show={state.exportNetworkUnion}
          showError={showError}
          protocolId={protocol.id}
          onUpdateOptions={handleUpdateEntityResolutionOptions}
          disabled={!state.exportNetworkUnion}
        />
      </ErrorBoundary> */}
      <div className="export__footer">
        <Button color="platinum" onClick={() => history.goBack()}>Cancel</Button>&nbsp;
        <Button type="submit" disabled={exportInProgress}>Export</Button>
      </div>
    </form>
  );
};

ExportScreen.propTypes = {
  apiClient: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  showConfirmation: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  resolverClient: PropTypes.any.isRequired,
  // resolverClient: PropTypes.shape({
  //   resolveProtocol: PropTypes.func.isRequired,
  // }).isRequired,
};

ExportScreen.defaultProps = {
  apiClient: null,
  protocol: null,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
  protocol: selectors.currentProtocol(state, ownProps),
});

const mapDispatchToProps = dispatch => ({
  showConfirmation: bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
  showError: bindActionCreators(messageActionCreators.showErrorMessage, dispatch),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withApiClient,
  withResolverClient,
  withRouter,
)(ExportScreen);

export {
  ExportScreen,
  availableCsvTypes,
};
