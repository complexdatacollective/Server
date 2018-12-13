import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router-dom';
import { remote } from 'electron';

import Types from '../types';
import Filter from '../components/Filter'; // eslint-disable-line import/no-named-as-default
import DrawerTransition from '../components/Transitions/Drawer';
import Checkbox from '../ui/components/Fields/Checkbox';
import Radio from '../ui/components/Fields/Radio';
import Toggle from '../ui/components/Fields/Toggle';
import ExportModal from '../components/ExportModal';
import withApiClient from '../components/withApiClient';
import { selectors } from '../ducks/modules/protocols';
import { Button, Spinner } from '../ui';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';

const defaultFilter = {
  join: '',
  rules: [],
};

const availableCsvTypes = {
  adjacencyMatrix: 'Adjacency Matrix',
  adjacencyList: 'Adjacency List',
  attributeList: 'Attribute List',
};

class ExportScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      exportFormat: 'graphml',
      exportNetworkUnion: false,
      csvTypes: new Set(Object.keys(availableCsvTypes)),
      filter: defaultFilter,
      useDirectedEdges: true,
    };
  }

  handleFilterChange = (filter) => {
    this.setState({ filter });
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
      filter,
      useDirectedEdges,
    } = this.state;

    apiClient
      .post(`/protocols/${protocolId}/export_requests`, {
        exportFormats: (exportFormat === 'csv' && [...csvTypes]) || [exportFormat],
        exportNetworkUnion,
        destinationFilepath,
        filter,
        useDirectedEdges,
      })
      .then(() => showConfirmation('Export complete'))
      .catch(err => showError(err.message))
      .then(() => this.setState({ exportInProgress: false }));
  }

  render() {
    const { protocol, protocolsHaveLoaded, variableRegistry } = this.props;

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
        <h1>{protocol.name}</h1>
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
                </div>
              </div>
            </DrawerTransition>
          </div>
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
        <div className="export__section">
          <h3>Filtering</h3>
          <p>Optionally filter the network(s) before export.</p>
          <Filter
            filter={this.state.filter}
            onChange={this.handleFilterChange}
            variableRegistry={variableRegistry}
          />
        </div>
        <Button type="submit" disabled={exportInProgress}>Export</Button>
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
  variableRegistry: PropTypes.object,
};

ExportScreen.defaultProps = {
  apiClient: null,
  protocol: null,
  variableRegistry: null,
};

const mapStateToProps = (state, ownProps) => ({
  protocolsHaveLoaded: selectors.protocolsHaveLoaded(state),
  protocol: selectors.currentProtocol(state, ownProps),
  variableRegistry: selectors.transposedRegistry(state, ownProps),
});

const mapDispatchToProps = dispatch => ({
  showConfirmation: bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
  showError: bindActionCreators(messageActionCreators.showErrorMessage, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withApiClient(ExportScreen));

export {
  ExportScreen,
  availableCsvTypes,
};
