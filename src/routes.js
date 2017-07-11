/* eslint-disable */

import React from 'react';
import {
  HashRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import { ExportScreen, Tray } from './containers';

export default () => (
  <Router>
    <Switch>
      <Route path="/tray" component={Tray} />
      <Route path="/" component={ExportScreen} />
    </Switch>
  </Router>
);
