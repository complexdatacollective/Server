import React from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { PairDevice, OverviewScreen, SettingsScreen, WorkspaceScreen } from './';
import { TabBar } from '../components';

const AppRoutes = () => (
  <React.Fragment>
    <Route path="/workspaces/:id" component={TabBar} />
    <main className="app__main">
      <Switch>
        <Route path="/overview" component={OverviewScreen} />
        <Route exact path="/workspaces/:id/" component={WorkspaceScreen} />
        <Route exact path="/workspaces/:id/settings" component={SettingsScreen} />
        {/* <Route path="/export" component={ExportScreen} /> */}
        <Route>
          <Redirect to="/overview" />
        </Route>
      </Switch>
      <PairDevice />
    </main>
  </React.Fragment>
);

export default AppRoutes;
