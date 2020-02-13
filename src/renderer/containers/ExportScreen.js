import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuid from 'uuid';
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
import Types from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import ExportModal from '../components/ExportModal';
import withApiClient from '../components/withApiClient';
import { selectors } from '../ducks/modules/protocols';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';
import EntityResolution from './EntityResolution';
import Resolver from './Resolver';

const mockMatch = (a, b) => ({
  a: { id: uuid(), attributes: a },
  b: { id: uuid(), attributes: b },
  prob: Math.random(),
});

const rAge = () => Math.ceil(Math.random() * 100);

const matches = [
  mockMatch({ name: 'bar', age: rAge() }, { name: 'foo', age: rAge() }),
  mockMatch({ name: 'hello', age: rAge() }, { name: 'hell', age: rAge() }),
  mockMatch({ name: 'wyh', age: rAge() }, { name: 'why', age: rAge() }),
  mockMatch({ name: 'bar', age: rAge() }, { name: 'bazz', age: rAge() }),
  mockMatch({ name: 'test', age: rAge() }, { name: 'teeest', age: rAge() }),
  mockMatch({ name: 'hi', age: rAge() }, { name: 'hey', age: rAge() }),
];

const entityCount = matches.length + 3;

const availableCsvTypes = {
  adjacencyMatrix: 'Adjacency Matrix',
  attributeList: 'Attribute List',
  edgeList: 'Edge List',
};

class ExportScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      exportFormat: 'csv',
      exportNetworkUnion: false,
      csvTypes: new Set([...Object.keys(availableCsvTypes), 'ego']),
      useDirectedEdges: true,
      useEgoData: true,
    };
  }

  handleFormatChange = (evt) => {
    const exportFormat = evt.target.value;
    this.setState({ exportFormat });
  }

  handleCsvTypeChange = (evt) => {
    const csvTypes = new Set(this.state.csvTypes);
    if (evt.target.checked) {
      csvTypes.add(evt.target.value);
    } else {
      csvTypes.delete(evt.target.value);
    }
    this.setState({ csvTypes });
  }

  handleUnionChange = (evt) => {
    this.setState({ exportNetworkUnion: evt.target.value === 'true' });
  }

  handleDirectedEdgesChange = (evt) => {
    this.setState({ useDirectedEdges: evt.target.checked });
  }

  handleEgoDataChange = (evt) => {
    this.setState({ useEgoData: evt.target.checked });
  }

  handleExport = () => {
    if (!this.formatsAreValid()) {
      this.props.showError('Please select at least one file type to export');
      return;
    }

    const defaultName = this.props.protocol.name || 'network-canvas-data';
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
        this.setState(
          { exportInProgress: true },
          () => this.exportToFile(filepath),
        );
      }
    });
  }

  handleCancel = () => {
    // this.setState({ exportInProgress: false });
    // TODO: cancel underlying requests with an AbortController (requires Electron 3+)
    // Temporary workaround:
    remote.getCurrentWindow().reload();
  }

  formatsAreValid() {
    return this.state.exportFormat === 'graphml' || this.state.csvTypes.size > 0;
  }

  exportToFile = (destinationFilepath) => {
    const { apiClient, showError, showConfirmation, protocol: { id: protocolId } } = this.props;
    if (!apiClient) {
      return;
    }

    const {
      exportFormat,
      exportNetworkUnion,
      csvTypes,
      useDirectedEdges,
      useEgoData,
    } = this.state;

    const csvTypesNoEgo = new Set(this.state.csvTypes);
    csvTypesNoEgo.delete('ego');
    const exportCsvTypes = useEgoData ? csvTypes : csvTypesNoEgo;
    const showCsvOpts = exportFormat === 'csv';

    apiClient
      .post(`/protocols/${protocolId}/export_requests`, {
        exportFormats: (exportFormat === 'csv' && [...exportCsvTypes]) || [exportFormat],
        exportNetworkUnion,
        destinationFilepath,
        useDirectedEdges,
        useEgoData: useEgoData && showCsvOpts,
      })
      .then(() => showConfirmation('Export complete'))
      .catch(err => showError(err.message))
      .then(() => this.setState({ exportInProgress: false }));
  }

  render() {
    const { protocol, protocolsHaveLoaded, history } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    const showCsvOpts = this.state.exportFormat === 'csv';
    const { exportInProgress } = this.state;

    return (
      <form className="export" onSubmit={this.handleExport}>
        {
          <ExportModal
            className="modal--export"
            show={exportInProgress}
            handleCancel={this.handleCancel}
          />
        }
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
                checked: this.state.exportFormat === 'graphml',
                value: 'graphml',
                onChange: this.handleFormatChange,
              }}
            />
          </div>
          <div>
            <Radio
              label="CSV"
              input={{
                name: 'export_format',
                checked: this.state.exportFormat === 'csv',
                value: 'csv',
                onChange: this.handleFormatChange,
              }}
            />
          </div>
          <div className="export__csv-types">
            <Toggle
              disabled={this.state.exportFormat === 'graphml'}
              label="Include Ego data?"
              input={{
                name: 'export_ego_data',
                onChange: this.handleEgoDataChange,
                value: this.state.exportFormat === 'csv' && this.state.useEgoData,
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
                          checked: this.state.csvTypes.has(csvType),
                          value: csvType,
                          onChange: this.handleCsvTypeChange,
                        }}
                      />
                    </div>
                  ))
                }
                <DrawerTransition in={this.state.useEgoData}>
                  <div key="export_csv_type_ego">
                    <Checkbox
                      label="Ego Attribute List"
                      input={{
                        name: 'export_ego_attributes',
                        checked: this.state.csvTypes.has('ego'),
                        value: 'ego',
                        onChange: this.handleCsvTypeChange,
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
              onChange: this.handleDirectedEdgesChange,
              value: this.state.useDirectedEdges,
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
                checked: this.state.exportNetworkUnion === false,
                value: 'false',
                onChange: this.handleUnionChange,
              }}
            />
          </div>
          <div>
            <Radio
              label="Export the union of all interview networks"
              input={{
                name: 'export_network_union',
                checked: this.state.exportNetworkUnion === true,
                value: 'true',
                onChange: this.handleUnionChange,
              }}
            />
          </div>
        </div>
        <ErrorBoundary>
          <EntityResolution show={this.state.exportNetworkUnion} />
          <Resolver
            entityCount={entityCount}
            matches={matches}
          />
        </ErrorBoundary>
        <div className="export__section">
          <br />
        </div>
        <div className="export__footer">
          <Button color="platinum" onClick={() => history.goBack()}>Cancel</Button>&nbsp;
          <Button type="submit" disabled={exportInProgress}>Export</Button>
        </div>
      </form>
    );
  }
}

ExportScreen.propTypes = {
  apiClient: PropTypes.object,
  protocol: Types.protocol,
  protocolsHaveLoaded: PropTypes.bool.isRequired,
  showConfirmation: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
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
  withRouter,
)(ExportScreen);

export {
  ExportScreen,
  availableCsvTypes,
};
