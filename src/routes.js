/* eslint-disable */

import React from 'react';
import {
  HashRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import {
  ExportScreen,
  ServerSetupScreen,
  OverviewScreen
} from './containers';

export default () => (
  <Router>
    <Switch>
      <Route path="/setup" component={ServerSetupScreen} />
      <Route path="/export" component={ExportScreen} />
      <Route path="/" component={OverviewScreen} />
    </Switch>
  </Router>
);
