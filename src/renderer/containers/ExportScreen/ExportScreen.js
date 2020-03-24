/* eslint-disable */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect, withRouter } from 'react-router-dom';
import { remote } from 'electron';
import { compose } from 'recompose';
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
import EntityResolutionSettings from './EntityResolutionSettings';
import Resolver from './Resolver';
import useExportSettingsState, { availableCsvTypes } from './useExportSettingsState';
import useResolver from './useResolver';

const ExportScreen = ({
  apiClient,
  resolverClient,
  protocol,
  protocolsHaveLoaded,
  history,
  showConfirmation,
  showError,
}) => {
  const [state, setState] = useState({ exportInProgress: false });

  const [
    exportSettings,
    {
      selectResolution,
      selectCreateNewResolution,
      updateSetting,
      csvTypeChange,
    },
  ] = useExportSettingsState();

  const [resolverState, resolveProtocol, resetResolver] = useResolver({ showError });

  const saveResolution = (resolution) => {
    const {
      id: protocolId,
    } = protocol;

    const {
      entityResolutionOptions: { entityResolutionPath },
    } = exportSettings;

    if (!apiClient) {
      return Promise.reject();
    }

    const options = {
      entityResolutionPath,
    };

    return apiClient
      .post(`/protocols/${protocolId}/resolutions`, { options, resolution })
      .then(({ resolutionId }) => {
        setState({
          ...resolverState,
          resolveRequestId: null,
          entityResolutionOptions: {
            ...resolverState.entityResolutionOptions,
            resolutionId,
            createNewResolution: false,
          },
        });
      })
      .then(() => promptAndExport())
      .catch(err => showError(err.message));
  };

  const exportToFile = (destinationFilepath) => {
    if (!apiClient) {
      return;
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
      entityResolutionOptions,
    } = exportSettings;

    const csvTypesNoEgo = new Set(exportSettings.csvTypes);
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
      .then(() => setState({ exportInProgress: false }));
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

    remote.dialog.showSaveDialog(exportDialog)
      .then(({ canceled, filePath }) => {
        if (canceled || !filePath) { return; }
        setState(
          { exportInProgress: true },
          () => exportToFile(filePath),
        );
      });
  };

  const handleSubmit = () => {
    const { createNewResolution, exportFormat, csvTypes } = exportSettings;

    const formatsAreValid = exportFormat === 'graphml' || csvTypes.size > 0;

    if (!formatsAreValid) {
      showError('Please select at least one file type to export');
      return;
    }

    if (createNewResolution) {
      resolveProtocol();
      return;
    }

    promptAndExport();
  };

  const handleResolved = (resolutions) => {
    saveResolution(resolutions)
      .then(resetResolver);
  };

  const handleCancelResolver = () => {
    resetResolver();
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

  const showCsvOpts = exportSettings.exportFormat === 'csv';
  const { exportInProgress } = state;

  return (
    <form className="export" onSubmit={handleSubmit}>
      <ExportModal
        className="modal--export"
        show={exportInProgress}
        handleCancel={handleCancel}
      />
      <ErrorBoundary>
        <Resolver
          key={resolverState.resolveRequestId}
          matches={resolverState.matches}
          isLoadingMatches={resolverState.isLoadingMatches}
          show={resolverState.showResolver}
          onCancel={handleCancelResolver}
          onResolved={handleResolved}
        />
      </ErrorBoundary>
      <h1>Export Data {resolverState.resolveRequestId}</h1>
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
              checked: exportSettings.exportFormat === 'graphml',
              value: 'graphml',
              onChange: () => updateSetting('exportFormat', 'graphml'),
            }}
          />
        </div>
        <div>
          <Radio
            label="CSV"
            input={{
              name: 'export_format',
              checked: exportSettings.exportFormat === 'csv',
              value: 'csv',
              onChange: () => updateSetting('exportFormat', 'csv'),
            }}
          />
        </div>
        <div className="export__csv-types">
          <Toggle
            disabled={exportSettings.exportFormat === 'graphml'}
            label="Include Ego data?"
            input={{
              name: 'export_ego_data',
              onChange: (e) => updateSetting('useEgoData', e.target.checked),
              value: exportSettings.exportFormat === 'csv' && exportSettings.useEgoData,
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
                        checked: exportSettings.csvTypes.has(csvType),
                        value: csvType,
                        onChange: (e) => csvTypeChange(csvType, e.target.checked),
                      }}
                    />
                  </div>
                ))
              }
              <DrawerTransition in={exportSettings.useEgoData}>
                <div key="export_csv_type_ego">
                  <Checkbox
                    label="Ego Attribute List"
                    input={{
                      name: 'export_ego_attributes',
                      checked: exportSettings.csvTypes.has('ego'),
                      value: 'ego',
                      onChange: (e) => csvTypeChange('ego', e.target.checked),
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
            onChange: e => updateSetting('useDirectedEdges', e.target.checked),
            value: exportSettings.useDirectedEdges,
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
              checked: exportSettings.exportNetworkUnion === false,
              value: 'false',
              onChange: () => updateSetting('exportNetworkUnion', false),
            }}
          />
        </div>
        <div>
          <Radio
            label="Export the union of all interview networks"
            input={{
              name: 'export_network_union',
              checked: exportSettings.exportNetworkUnion === true,
              value: 'true',
              onChange: () => updateSetting('exportNetworkUnion', true),
            }}
          />
        </div>
      </div>
      <ErrorBoundary>
        <EntityResolutionSettings
          resolveRequestId={resolverState.resolveRequestId}
          show={exportSettings.exportNetworkUnion}
          showError={showError}
          protocolId={protocol.id}
          enableEntityResolution={exportSettings.enableEntityResolution}
          resolutionId={exportSettings.resolutionId}
          createNewResolution={exportSettings.createNewResolution}
          minimumThreshold={exportSettings.minimumThreshold}
          entityResolutionPath={exportSettings.entityResolutionPath}
          onUpdateSetting={updateSetting}
          onSelectResolution={selectResolution}
          onSelectCreateNewResolution={selectCreateNewResolution}
          disabled={!exportSettings.exportNetworkUnion}
        />
      </ErrorBoundary>
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
