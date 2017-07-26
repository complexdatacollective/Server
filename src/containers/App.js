import React from 'react';
import PropTypes from 'prop-types';
import { BarChartWrapper } from '../components';

require('../styles/main.scss');

/**
  * Main app container.
  * @param props {object} - children
  */
const App = props => (
  <div className="app">
    { props.children }
    <BarChartWrapper />
  </div>
);

App.propTypes = {
  children: PropTypes.any,
};

App.defaultProps = {
  children: null,
};

export default App;
