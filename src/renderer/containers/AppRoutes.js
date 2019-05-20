import React, { Component } from 'react';
import {
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';

import { PairDevice, OverviewScreen, SettingsScreen, ExportScreen, WorkspaceScreen } from './';
import PairedDeviceList from '../components/PairedDeviceList';
import { ServerPanel } from '../components';

class AppRoutes extends Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
  }

  render() {
    // WorkspaceScreen takes a scrollContainerRef prop for sortable panels. This allows
    // the main content area to scroll when a panel is being dragged.
    const workspaceRenderer = props =>
      <WorkspaceScreen scrollContainerRef={this.scrollContainerRef} {...props} />;

    return (
      <React.Fragment>
        <ServerPanel />
        <main className="app__main" ref={this.scrollContainerRef}>
          <Switch>
            <Route path="/overview" component={OverviewScreen} />
            <Route exact path="/workspaces/:id/" render={workspaceRenderer} />
            <Route exact path="/workspaces/:id/settings" component={SettingsScreen} />
            <Route exact path="/workspaces/:id/export" component={ExportScreen} />
            <Route exact path="/devices" component={PairedDeviceList} />
            <Route>
              <Redirect to="/overview" />
            </Route>
          </Switch>
          <PairDevice />
        </main>
      </React.Fragment>
    );
  }
}

export default AppRoutes;
