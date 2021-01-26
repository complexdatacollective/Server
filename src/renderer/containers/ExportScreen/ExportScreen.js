import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect, useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import { Button, Spinner, ProgressBar, Icon } from '@codaco/ui';
import CheckboxGroup from '@codaco/ui/lib/components/Fields/CheckboxGroup';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import { Toggle } from '@codaco/ui/lib/components/Fields';
import Number from '@codaco/ui/lib/components/Fields/Number';
import Types from '../../types';
import useExportStatus from '../../hooks/useExportStatus';
import { selectors } from '../../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { actionCreators as toastActions } from '../../ducks/modules/toasts';
import useExportOptions, { exportFormats } from './useExportOptions';
import EntityResolverSettings from './EntityResolverSettings';

const CSVOptions = [
  { label: 'Adjacency Matrix. Note: do not use when exporting 1000+ sessions.', key: 'adjacencyMatrix' },
  { label: 'Attribute List', key: 'attributeList' },
  { label: 'Edge List', key: 'edgeList' },
];

const expandVariants = {
  initial: { opacity: 0 },
  exit: { opacity: 0 },
  animate: { opacity: 1 },
};

const renderStatus = data => (
  <React.Fragment>
    <p>{data.statusText}</p>
    <ProgressBar orientation="horizontal" percentProgress={data.progress} />
  </React.Fragment>
);

const renderErrors = errors => (
  <div className="export-modal">
    <p>
      Your export completed, but non-fatal errors were encountered during the process. This
      may mean that not all sessions or all formats were able to be exported.
      Review the details of these errors below, and ensure that you check the data you
      received.
    </p>
    <h4>Errors:</h4>
    <ul className="export-modal__error-list">
      {errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  </div>
);

const EXPORT_UPDATE_TOAST = 'export-status-toast';
const EXPORT_COMPLETE_TOAST = 'export-complete-toast';

const ExportScreen = ({
  protocol,
  protocolsHaveLoaded,
}) => {
  const dispatch = useDispatch();

  const [exportOptions, exportOptionsFormState, handleUpdateFormState] = useExportOptions();

  const { exportToFile, exportStatus, resetState, cancelExport } = useExportStatus();

  const handleExportFinished = (fatalError = false) => {
    dispatch(toastActions.removeToast(EXPORT_UPDATE_TOAST));

    if (fatalError) {
      return;
    }

    // If there were errors, show a dialog
    if (exportStatus.errors.length > 0) {
      dispatch(dialogActions.openDialog({
        type: 'Warning',
        title: 'Export finished, but with errors',
        message: renderErrors(exportStatus.errors),
        canCancel: false,
      }));

      return;
    }

    dispatch(toastActions.addToast({
      id: EXPORT_COMPLETE_TOAST,
      type: 'success',
      title: 'Export complete!',
      content: (
        <React.Fragment>
          <p>Your export finished successfully.</p>
        </React.Fragment>
      ),
    }));
  };

  const handleExportUpdate = () => {
    if (exportStatus.status === 'starting') {
      dispatch(toastActions.addToast({
        id: EXPORT_UPDATE_TOAST,
        type: 'info',
        title: 'Exporting...',
        autoDismiss: false,
        dismissHandler: cancelExport,
        CustomIcon: (<Spinner small />),
        content: renderStatus(exportStatus),
      }));
      return;
    }

    if (exportStatus.status === 'finished') {
      handleExportFinished();
      return;
    }

    const exportHasErrors = exportStatus.errors && exportStatus.errors.length > 0;

    dispatch(toastActions.updateToast(EXPORT_UPDATE_TOAST, {
      title: exportHasErrors ? 'Exporting (Non-fatal errors encountered)...' : 'Exporting...',
      CustomIcon: exportHasErrors ? (<Icon name="warning" />) : (<Spinner small />),
      content: renderStatus(exportStatus),
    }));
  };

  useEffect(() => {
    handleExportUpdate();
  }, [exportStatus.status, exportStatus.progress, exportStatus.errors]);

  const promptAndExport = () => exportToFile(protocol, exportOptions)
    .catch((e) => { // These are fatal errors with the process
      dispatch(dialogActions.openDialog({
        type: 'Error',
        title: 'Fatal Error Encountered During Export',
        error: e.message,
      }));

      handleExportFinished(true);
      resetState();
    });

  const handleSubmit = () => {
    promptAndExport();
  };

  if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocol) { // This protocol hasn't loaded yet
    return <div className="export--loading"><Spinner /></div>;
  }

  const { exportInProgress } = exportStatus;
  const noFormatSelected = exportOptionsFormState.exportFormats.length === 0;

  return (
    <React.Fragment>
      <form className="content export" onSubmit={handleSubmit}>
        <h1>Export Session Data</h1>
        <div className="export__options">
          <AnimateSharedLayout>
            <div className="export__section">
              <h3>1. Select File Types</h3>
              <p>
                Choose one or more export formats. At the end of the process, all files will be
                archived in a single ZIP for download.
              </p>
              <div className="export__row">
                <CheckboxGroup
                  options={exportFormats}
                  input={{
                    name: 'exportFormats',
                    value: exportOptionsFormState.exportFormats,
                    onChange: value => handleUpdateFormState('exportFormats', value),
                  }}
                  meta={{
                    touched: true,
                    invalid: noFormatSelected,
                    error: 'You must select at least one type of file for export',
                  }}
                />
                <p>
                  GraphML is the main file format used by the Network Canvas software because it is
                  modern, robust, and an open standard. GraphML files can be opened by many
                  other pieces of network analysis software, but you should check that the software
                  you intend to use supports this format.
                </p>
                <p>
                  CSV is a widely used format for storing network data, but this wider compatibility
                  comes at the expense of robustness. If you enable this format, your networks will
                  be exported as a series of CSV files:
                </p>
                <ul>
                  <li>an <strong>attribute list file</strong> for each node type</li>
                  <li>an <strong>edge list file</strong> for each edge type</li>
                  <li>an <strong>egoattribute file</strong> that also contains session data</li>
                </ul>
              </div>
            </div>
            <div className="export__section">
              <h3>2. Choose Export Options</h3>
              <p>These options apply to both GraphML and CSV exports.</p>
              <div className="export__row">
                <Toggle
                  label="Merge Sessions by Protocol"
                  input={{
                    value: exportOptionsFormState.unifyNetworks,
                    onChange: () =>
                      handleUpdateFormState('unifyNetworks', !exportOptionsFormState.unifyNetworks),
                  }}
                />
                <p>
                  If you enable this option, exporting multiple sessions at the same time will
                  causethem to be merged into a single file, on a per-protocol basis. In the case
                  of CSV export, you will receive one of each type of file for each protocol. In
                  the case of GraphML you will receive a single GraphML file with
                  multiple <code>&lt;graph&gt;</code> elements. Please note that most software
                  does not yet support multiple graphs in a single GraphML file.
                </p>
              </div>
              <div className="export__row">
                <Toggle
                  label="Use Screen Layout Co-ordinates"
                  input={{
                    value: exportOptionsFormState.useScreenLayoutCoordinates,
                    onChange: () =>
                      handleUpdateFormState('useScreenLayoutCoordinates', !exportOptionsFormState.useScreenLayoutCoordinates),
                  }}
                />
                <p>
                  By default, Interviewer exports sociogram node coordinates as normalized X/Y
                  values (a number between 0 and 1 for each axis, with the origin in the top left).
                  Enabling this option will create an <em>additional</em> variable that represents
                  these coordinates as screen space pixel values.
                </p>
              </div>
              <AnimatePresence>
                { exportOptionsFormState.useScreenLayoutCoordinates &&
                  <motion.div
                    animate={expandVariants.animate}
                    exit={expandVariants.exit}
                    initial={expandVariants.initial}
                  >
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
                  </motion.div>
                }
              </AnimatePresence>
            </div>
            <AnimatePresence>
              { exportOptionsFormState.exportFormats.includes('CSV') &&
                <motion.div
                  className="export__section"
                  animate={expandVariants.animate}
                  exit={expandVariants.exit}
                  initial={expandVariants.initial}
                  layout
                >
                  <h3>3. CSV Specific File Options</h3>
                  <p>Select which files to include in the CSV export.</p>
                  <p><em>Ego Attribute List contains session data and is required.</em></p>
                  <div className="export__row">
                    <Checkbox
                      label="Ego Attribute List (required)"
                      input={{
                        value: true,
                        onChange: () => {},
                      }}
                      disabled
                    />
                  </div>
                  {[CSVOptions.map(({ label, key }) => (
                    <div key={key} className="export__row">
                      <Checkbox
                        label={label}
                        input={{
                          value: exportOptionsFormState[key],
                          onChange: () => handleUpdateFormState(key, !exportOptionsFormState[key]),
                        }}
                      />
                    </div>
                  ))]}
                </motion.div>
              }
            </AnimatePresence>
            <div className="export__section">
              <h3>{exportOptionsFormState.exportFormats.includes('CSV') ? '4' : '3' }. Entity Resolver</h3>
              <p>Use an external application to resolve nodes in a unified network.</p>
              <EntityResolverSettings
                protocolId={protocol.id}
                onUpdate={console.log}
              />
            </div>
          </AnimateSharedLayout>
          <div className="buttons">
            <Button type="submit" disabled={exportInProgress || noFormatSelected}>Begin Export</Button>
          </div>
        </div>
      </form>
    </React.Fragment>
  );
};

ExportScreen.propTypes = {
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
};

ExportScreen.defaultProps = {
  protocol: null,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
  protocol: selectors.currentProtocol(state, ownProps),
});

const mapDispatchToProps = {
};

export {
  ExportScreen,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(ExportScreen);
