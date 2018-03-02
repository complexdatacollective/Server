/* eslint-disable */

import React from 'react';
import {
  HashRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import { ExportScreen, OverviewScreen, SettingsScreen } from './containers';

export default () => (
  <Router>
    <Switch>
      <Route path="/settings" component={SettingsScreen} />
      <Route path="/export" component={ExportScreen} />
      <Route path="/" component={OverviewScreen} />
    </Switch>
  </Router>
);
