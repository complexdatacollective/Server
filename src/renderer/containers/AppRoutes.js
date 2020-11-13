import React, { Component } from 'react';
import {
  Route,
  Redirect,
  Switch,
  BrowserRouter as Router,
} from 'react-router-dom';
import { WorkspaceNav } from '../components';

import { CaseManagement, ExportScreen, OverviewScreen, PairDevice, SettingsScreen, WorkspaceScreen } from './';

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
      <main className="app__main" ref={this.scrollContainerRef}>
        <Router>
          <React.Fragment>
            <Route path="/workspaces/:id/" component={WorkspaceNav} />
            <Switch>
              <div className="workspace-wrapper">
                <Route path="/overview" component={OverviewScreen} />
                <Route exact path="/workspaces/:id/" render={workspaceRenderer} />
                <Route exact path="/workspaces/:id/casemanagement" component={CaseManagement} />
                <Route exact path="/workspaces/:id/settings" component={SettingsScreen} />
                <Route exact path="/workspaces/:id/export" component={ExportScreen} />
              </div>
            </Switch>
          </React.Fragment>
        </Router>
        <PairDevice />
      </main>
    );
  }
}

export default AppRoutes;
