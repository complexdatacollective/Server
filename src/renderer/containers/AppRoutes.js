import React, { Component } from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import { TopPanel, WorkspaceNav } from '../components';

import { CaseManagement, ExportScreen, OverviewScreen, PairDevice, SettingsScreen, WorkspaceScreen } from './';
import EntityResolverScreen from './EntityResolverScreen';

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
        <React.Fragment>
          <TopPanel {...this.props} >
            <Route path="/workspaces/:id" component={WorkspaceNav} />
          </TopPanel>
          <Switch>
            <Route exact path="/" render={() => (<OverviewScreen />)} />
            <Route exact path="/workspaces/:id" render={workspaceRenderer} />
            <Route exact path="/workspaces/:id/casemanagement" component={CaseManagement} />
            <Route exact path="/workspaces/:id/settings" render={props => (<SettingsScreen {...props} />)} />
            <Route exact path="/workspaces/:id/export" render={props => (<ExportScreen {...props} />)} />
            <Route exact path="/workspaces/:id/resolve" render={props => (<EntityResolverScreen {...props} />)} />
          </Switch>
        </React.Fragment>
        <PairDevice />
      </main>
    );
  }
}

export default AppRoutes;
