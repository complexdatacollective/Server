/* eslint-disable */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { AnimatePresence, AnimateSharedLayout, motion } from 'framer-motion';
import { Button, Spinner } from '@codaco/ui';
import CheckboxGroup from '@codaco/ui/lib/components/Fields/CheckboxGroup';
import Checkbox from '@codaco/ui/lib/components/Fields/Checkbox';
import Number from '@codaco/ui/lib/components/Fields/Number';
import Types from '../../types';
import ExportModal from '../../components/ExportModal';
import { selectors } from '../../ducks/modules/protocols';
import { actionCreators as messageActionCreators } from '../../ducks/modules/appMessages';
import useAdminClient from '../../hooks/useAdminClient';
import useExportOptions, { exportFormats } from './useExportOptions';

const CSVOptions = [
  { label: 'Adjacency Matrix', key: 'adjacencyMatrix' },
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
  history,
  showError,
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
      <form className="export" onSubmit={handleSubmit}>
        <h1>Export Session Data</h1>
        <div className="export__options">
          <AnimateSharedLayout>
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
            </div>
            <div className="export__section">
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
                  <h3>CSV File Options</h3>
                  <p>Select which files to include in the CSV export.</p>
                  <p><em>Ego Attribute List contains session data and is required.</em></p>
                  <div className="export__row">
                      <Checkbox
                        label="Ego Attribute List (required)"
                        input={{
                          value: true,
                        }}
                        disabled="disabled"
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

const mapDispatchToProps = {
  showError: messageActionCreators.showErrorMessage,
};

export {
  ExportScreen,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExportScreen);
