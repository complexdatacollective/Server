import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Types from '../types';
import { selectors } from '../ducks/modules/protocols';
import { Filter } from '../components/Filter';
import { Button, Spinner } from '../ui';

const ExportScreen = ({ protocol, protocolsHaveLoaded }) => {
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
          <Filter />
        </div>
      </div>
      <Button size="small">Export</Button>
    </div>
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

export default connect(mapStateToProps)(ExportScreen);

// export default ExportScreen;
