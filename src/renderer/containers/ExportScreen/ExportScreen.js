/* eslint-disable */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { remote } from 'electron';
import { compose } from 'recompose';
import { Button, Spinner } from '@codaco/ui';
import CheckboxGroup from '@codaco/ui/lib/components/Fields/CheckboxGroup';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import Number from '@codaco/ui/lib/components/Fields/Number';
import Types from '../../types';
import ExportModal from '../../components/ExportModal';
import { selectors } from '../../ducks/modules/protocols';
// import useAdminClient from '../../hooks/useAdminClient';
import useExportOptions, { exportFormats } from './useExportOptions';

const CSVOptions = [
  { label: 'Adjacency Matrix', key: 'adjacencyMatrix' },
  { label: 'Attribute List', key: 'attributeList' },
  { label: 'Ego Attribute List', key: 'egoAttributeList' },
  { label: 'Edge List', key: 'edgeList' },
];

const ExportScreen = ({
  protocol,
  protocolsHaveLoaded,
  history,
  showError,
}) => {

  const [state, setState] = useState({
    exportInProgress: false,
    resolutionsKey: null,
  });

  const [exportOptions, exportOptionsFormState, handleUpdateFormState] = useExportOptions();

  // const { exportToFile, saveResolutions } = useAdminClient();

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
      resolutionsRef.current.resolveProtocol(protocol, { ...exportSettings, resolverOptions });
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

  const { exportInProgress } = state;

  console.log({ exportOptions });

  return (
    <React.Fragment>
      <ExportModal
        className="modal--export"
        show={exportInProgress}
        handleCancel={handleCancelExport}
      />
      <form className="export" onSubmit={handleSubmit}>
        <h1>Export Session Data</h1>
        <div className="export__section">
          <h3>File Types</h3>
          <p>
            Choose export formats. If multiple files are produced, they’ll be archived in a ZIP
            for download.
          </p>
          <div className="export__row">
            <CheckboxGroup
              options={exportFormats}
              input={{
                name: 'exportFormats',
                value: exportOptionsFormState.exportFormats,
                onChange: value => handleUpdateFormState('exportFormats', value),
              }}
            />
          </div>
          <h3>Export Options</h3>
          <p>These options apply to both GraphML and CSV exports.</p>
          <div className="export__row">
            <Checkbox
              label="Unify Networks"
              input={{
                value: exportOptionsFormState.unifyNetworks,
                onChange: () =>
                  handleUpdateFormState('unifyNetworks', !exportOptionsFormState.unifyNetworks),
              }}
            />
          </div>
          <div className="export__row">
            <Checkbox
              label="Use Screen Layout Co-ordinates"
              input={{
                value: exportOptionsFormState.useScreenLayoutCoordinates,
                onChange: () =>
                  handleUpdateFormState('useScreenLayoutCoordinates', !exportOptionsFormState.useScreenLayoutCoordinates),
              }}
            />
          </div>
          <div className="export__subpanel">
            <Number
              label="Screen Layout Height"
              input={{
                value: exportOptionsFormState.screenLayoutHeight,
                onChange: value => handleUpdateFormState('screenLayoutHeight', value),
              }}
            />
            <Number
              label="Screen Layout Width"
              input={{
                value: exportOptionsFormState.screenLayoutWidth,
                onChange: value => handleUpdateFormState('screenLayoutWidth', value),
              }}
            />
          </div>
          <div>
            <h3>CSV File Options</h3>
            <p>Select which files to include in the CSV export.</p>
            {[CSVOptions.map(({ label, key }) => (
              <div key={key} className="export__row">
                <Checkbox
                  label={label}
                  input={{
                    value: exportOptionsFormState[key],
                    onChange: value => handleUpdateFormState(key, !exportOptionsFormState[key]),
                  }}
                />
              </div>
            ))]}
          </div>
        </div>
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
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ExportScreen);
