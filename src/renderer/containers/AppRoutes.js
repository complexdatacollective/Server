/* eslint-disable */
import React from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { ExportScreen, PairDevice, OverviewScreen, SettingsScreen } from './';

// TODO: remove this if we won't need URL-based addressing of modals. (Now including PairDevice directly.)
// const ModalRoute = ({path, component}) => (
//   <Route path={`/:basePath*/modal/${path.replace(/^\//, '')}`} component={component} />
// );

export default () => (
  <React.Fragment>
    <Switch>
      <Route path="/dashboard" component={OverviewScreen} />
      <Route path="/settings" component={SettingsScreen} />
      <Route path="/export" component={ExportScreen} />
      <Route render={() => <Redirect to="/dashboard" />} />
    </Switch>

    <PairDevice />
  </React.Fragment>
);
