import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import Filter from '../components/Filter'; // eslint-disable-line import/no-named-as-default
import { selectors } from '../ducks/modules/protocols';
import { Button, Spinner } from '../ui';

const defaultFilter = {
  join: '',
  rules: [],
};

class ExportScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: defaultFilter,
    };
  }

  handleFilterChange = (filter) => {
    this.setState({ filter });
  }

  render() {
    const { protocol, protocolsHaveLoaded } = this.props;

    if (protocolsHaveLoaded && !protocol) { // This protocol doesn't exist
      return <Redirect to="/" />;
    }

    if (!protocol) { // This protocol hasn't loaded yet
      return <div className="settings--loading"><Spinner /></div>;
    }

    return (
      <div className="export">
        <h1>{protocol.name}</h1>
        <div className="export__section">
          <div className="export__description">
            <h3>Filetype</h3>
            <p>Choose an export format</p>
            <div>
              <input name="export_format" id="export_format_csv" type="radio" />
              <label htmlFor="export_format">
                CSVs (adjacency matrix, adjacency list, and attribute table)
              </label>
            </div>
            <div>
              <input name="export_format" id="export_format_graphml" type="radio" />
              <label htmlFor="export_format_graphml">
                GraphML
              </label>
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
        <Button size="small" disabled>Export</Button>
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
};
