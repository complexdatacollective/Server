/* eslint-disable */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
import { selectors } from '%modules/protocols';
import useAdminClient from '%renderer/hooks/useAdminClient';
import EntityResolverSettings from './EntityResolverSettings';
import Resolutions from '../EntityResolver/Resolutions';
import useExportSettingsState, { availableCsvTypes } from './useExportSettingsState';

const ExportScreen = ({
  protocol,
  protocolsHaveLoaded,
  history,
  showError,
}) => {
  const resolutionsRef = useRef();
  const [resolverActive, setResolverActive] = useState(false);

  const [state, setState] = useState({
    exportInProgress: false,
    resolutionsKey: null,
  });

  const [
    exportSettings,
    {
      selectResolution,
      selectCreateNewResolution,
      updateSetting,
      updateSettings, // does Resolver need this?
      csvTypeChange,
    },
  ] = useExportSettingsState();

  const { exportToFile, saveResolutions } = useAdminClient();

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

    return remote.dialog.showSaveDialog(exportDialog)
      .then(({ canceled, filePath }) => {
        if (canceled || !filePath) { return; }
        setState({ exportInProgress: true });

        return exportToFile(protocol, exportSettings, filePath)
          .finally(() => setState({ exportInProgress: false }));
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
      setResolverActive(true);
      resolutionsRef.current.resolveProtocol(protocol, exportSettings);
      return;
    }

    promptAndExport();
  };

  const handleCancelExport = () => {
    // setState({ exportInProgress: false });
    // TODO: cancel underlying requests with an AbortController (requires Electron 3+)
    // Temporary workaround:
    remote.getCurrentWindow().reload();
  };

  const handleCompletedResolutions = updatedSettings =>
    new Promise((resolve) => {
      updateSettings(updatedSettings);
      promptAndExport()
        .then(() => setResolverActive(false));
      resolve();
    });

  if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocol) { // This protocol hasn't loaded yet
    return <div className="settings--loading"><Spinner /></div>;
  }

  const showCsvOpts = exportSettings.exportFormat === 'csv';
  const { exportInProgress } = state;

  return (
    <React.Fragment>
      <ExportModal
        className="modal--export"
        show={exportInProgress}
        handleCancel={handleCancelExport}
      />
      <ErrorBoundary>
        <Resolutions
          ref={resolutionsRef}
          key={resolutionsRef.current && resolutionsRef.current.requestId}
          saveResolutions={saveResolutions} // TODO: can this be moved inside Resolutions?
          onComplete={handleCompletedResolutions}
        />
      </ErrorBoundary>
      <form className="export" onSubmit={handleSubmit}>
        <h1>Export Data</h1>
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
        { exportSettings.exportNetworkUnion &&
          <EntityResolverSettings
            createNewResolution={exportSettings.createNewResolution}
            enableEntityResolution={exportSettings.enableEntityResolution}
            onSelectCreateNewResolution={selectCreateNewResolution}
            onSelectResolution={selectResolution}
            onUpdateOptions={value => updateSetting('resolverOptions', value)}
            onUpdateSetting={updateSetting}
            protocolId={protocol.id}
            resolutionId={exportSettings.resolutionId}
            resolverActive={resolverActive} // used to refresh resolutions state
            resolverOptions={exportSettings.resolverOptions}
            show={exportSettings.exportNetworkUnion}
            showError={showError}
          />
        }
        <div className="export__footer">
          <Button color="platinum" onClick={() => history.goBack()}>Cancel</Button>&nbsp;
          <Button type="submit" disabled={exportInProgress}>Export</Button>
        </div>
      </form>
    </React.Fragment>
  );
};

ExportScreen.propTypes = {
  apiClient: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  showError: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
};

ExportScreen.defaultProps = {
  protocol: null,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
  protocol: selectors.currentProtocol(state, ownProps),
});

export {
  ExportScreen,
  availableCsvTypes,
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ExportScreen);
