import React from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { PairDevice, OverviewScreen, SettingsScreen } from './';

// TODO: remove this if we won't need URL-based addressing of modals.
// (Now including PairDevice directly.)
// const ModalRoute = ({path, component}) => (
//   <Route path={`/:basePath*/modal/${path.replace(/^\//, '')}`} component={component} />
// );

const AppRoutes = () => (
  <React.Fragment>
    <Switch>
      <Route path="/dashboard" component={OverviewScreen} />
      <Route path="/settings" component={SettingsScreen} />
      {/* <Route path="/export" component={ExportScreen} /> */}
      <Route>
        <Redirect to="/dashboard" />
      </Route>
    </Switch>

    <PairDevice />
  </React.Fragment>
);

export default AppRoutes;
