/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';
import TopPanel from '../components/workspace/TopPanel';
import WorkspaceNav from '../components/WorkspaceNav';
import CaseManagement from './CaseManagement';
import ExportScreen from './ExportScreen';
import OverviewScreen from './OverviewScreen';
import PairDevice from './PairDevice';
import SettingsScreen from './SettingsScreen';
import WorkspaceScreen from './workspace/WorkspaceScreen';
import EntityResolverScreen from './EntityResolverScreen';

class AppRoutes extends Component {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
  }

  render() {
    // WorkspaceScreen takes a scrollContainerRef prop for sortable panels. This allows
    // the main content area to scroll when a panel is being dragged.
    const workspaceRenderer = (
      props,
    // eslint-disable-next-line react/jsx-props-no-spreading
    ) => <WorkspaceScreen scrollContainerRef={this.scrollContainerRef} {...props} />;

    return (
      <main className="app__main" ref={this.scrollContainerRef}>
        <>
          <TopPanel {...this.props}>
            <Route path="/workspaces/:id" component={WorkspaceNav} />
          </TopPanel>
          <Switch>
            <Route exact path="/" render={() => (<OverviewScreen />)} />
            <Route exact path="/workspaces/:id" render={workspaceRenderer} />
            <Route exact path="/workspaces/:id/casemanagement" component={CaseManagement} />
            <Route exact path="/workspaces/:id/settings" render={(props) => (<SettingsScreen {...props} />)} />
            <Route exact path="/workspaces/:id/export" render={(props) => (<ExportScreen {...props} />)} />
            <Route
              exact
              path="/workspaces/:id/resolve"
              render={(props) => (<EntityResolverScreen {...props} />)}
            />
          </Switch>
        </>
        <PairDevice />
      </main>
    );
  }
}

export default AppRoutes;
