import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import CheckboxGroup from '@codaco/ui/lib/components/Fields/CheckboxGroup';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import { Toggle } from '@codaco/ui/lib/components/Fields';
import Number from '@codaco/ui/lib/components/Fields/Number';
import Types from '../../types';
import ExportModal from '../../components/ExportModal';
import { selectors } from '../../ducks/modules/protocols';
import useAdminClient from '../../hooks/useAdminClient';
import useExportOptions, { exportFormats } from './useExportOptions';

const CSVOptions = [
  { label: 'Adjacency Matrix. Please not that this format can produce extremely large files. Only select this option if you are certain that you need it.', key: 'adjacencyMatrix' },
  { label: 'Attribute List', key: 'attributeList' },
  { label: 'Edge List', key: 'edgeList' },
];

const expandVariants = {
  initial: { opacity: 0 },
  exit: { opacity: 0 },
  animate: { opacity: 1 },
};

const ExportScreen = ({
  protocol,
  protocolsHaveLoaded,
}) => {
  const [state, setState] = useState({
    exportInProgress: false,
  });

  const [exportOptions, exportOptionsFormState, handleUpdateFormState] = useExportOptions();

  const { exportToFile } = useAdminClient();

  const promptAndExport = () => {
    setState({ exportInProgress: true });

    return exportToFile(protocol, exportOptions)
      .catch((e) => {
        showError(e.message);
        setState({ exportInProgress: false });
      });
  };

  const handleSubmit = () => {
    const { exportCSV, exportGraphML } = exportOptions;

    if (!exportCSV && !exportGraphML) {
      showError('Please select at least one type of export');
      return;
    }

    if (!!exportCSV && Object.values(exportCSV).every(toggled => !toggled)) {
      showError('Please select at least one file type to export for CSV');
      return;
    }

    promptAndExport();
  };

  const handleCompleteExport = () => {
    setState({ exportInProgress: false });
  };

  if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
    return <Redirect to="/" />;
  }

  if (!protocol) { // This protocol hasn't loaded yet
    return <div className="settings--loading"><Spinner /></div>;
  }

  const { exportInProgress } = state;

  return (
    <React.Fragment>
      <ExportModal
        className="modal--export"
        show={exportInProgress}
        onCancel={handleCompleteExport}
        onComplete={handleCompleteExport}
      />
      <form className="content export" onSubmit={handleSubmit}>
        <h1>Export Session Data</h1>
        <div className="export__options">
          <AnimateSharedLayout>
            <div className="export__section">
              <h3>1. Select File Types</h3>
              <p>
                Choose one or more export formats. At the end of the process, all files will be archived in a single ZIP
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
                <p>
                GraphML is the main file format used by the Network Canvas software. GraphML files can be used to manually import your data into Server, and can be opened by many other pieces of network analysis software.
                </p>
                <p>
                CSV is a widely used format for storing network data, but this wider compatibility comes at the expense of robustness. If you enable this format, your networks will be exported as an <strong>attribute list file</strong> for each node type, an <strong>edge list file</strong> for each edge type, and an <strong>ego attribute file</strong> that also contains session data.
                </p>
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
                If you enable this option, exporting multiple sessions at the same time will cause them to be merged into a single file, on a per-protocol basis. In the case of CSV export, you will receive one of each type of file for each protocol. In the case of GraphML you will receive a single GraphML file with multiple <code>&lt;graph&gt;</code> elements. Please note that most software does not yet support multiple graphs in a single GraphML file. 
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
                By default, Interviewer exports sociogram node coordinates as normalized X/Y values (a number between 0 and 1 for each axis, with the origin in the top left). Enabling this option will store coordinates as screen space pixel values, with the same origin.
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
                        disabled={true}
                      />
                    </div>
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
                </motion.div>
              }
            </AnimatePresence>
          </AnimateSharedLayout>
          <div className="buttons">
            <Button type="submit" disabled={exportInProgress}>Begin Export</Button>
          </div>
        </div>
      </form>
    </React.Fragment>
  );
};

ExportScreen.propTypes = {
  apiClient: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
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
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExportScreen);
