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
  GetStartedScreen,
  OverviewScreen
} from './containers';

export default () => (
  <Router>
    <Switch>
      <Route path="/setup" component={GetStartedScreen} />
      <Route path="/export" component={ExportScreen} />
      <Route path="/" component={OverviewScreen} />
    </Switch>
  </Router>
);
