/* eslint-disable */

import React from 'react';
import {
  HashRouter as Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
import { HomePage } from './containers';

export default () => (
  <Router>
    <Switch>
      <Route path="/" component={HomePage} />
    </Switch>
  </Router>
);
