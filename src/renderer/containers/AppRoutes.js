import React from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { PairDevice, OverviewScreen, SettingsScreen, WorkspaceScreen } from './';

const AppRoutes = () => (
  <React.Fragment>
    <Switch>
      <Route path="/overview" component={OverviewScreen} />
      <Route path="/workspaces/:id" component={WorkspaceScreen} />
      { <Route path="/settings" component={SettingsScreen} /> }
      {/* <Route path="/export" component={ExportScreen} /> */}
      <Route>
        <Redirect to="/overview" />
      </Route>
    </Switch>

    <PairDevice />
  </React.Fragment>
);

export default AppRoutes;
