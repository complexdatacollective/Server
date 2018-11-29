import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import Filter from '../components/Filter'; // eslint-disable-line import/no-named-as-default
import DrawerTransition from '../components/Transitions/Drawer';
import { selectors } from '../ducks/modules/protocols';
import { Button, Spinner } from '../ui';
import Checkbox from '../ui/components/Fields/Checkbox';
import Radio from '../ui/components/Fields/Radio';

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
      exportFormat: null,
      csvTypes: new Set(Object.keys(availableCsvTypes)),
      filter: defaultFilter,
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

  render() {
    const { protocol, protocolsHaveLoaded } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    const showCsvOpts = this.state.exportFormat === 'csv';

    return (
      <div className="export">
        <h1>{protocol.name}</h1>
        <div className="export__section">
          <div className="export__description">
            <h3>Filetype</h3>
            <p>Choose an export format</p>
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
          </div>
        </div>
        <div className="export__section">
          <div className="export__description">
            <h3>Filtering</h3>
            <p>Optionally filter the network before export.</p>
            <Filter
              filter={this.state.filter}
              onChange={this.handleFilterChange}
              variableRegistry={protocol.variableRegistry}
            />
          </div>
        </div>
        <Button disabled>Export</Button>
      </div>
    );
  }
}

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

export default connect(mapStateToProps)(ExportScreen);

export {
  ExportScreen,
  availableCsvTypes,
};
