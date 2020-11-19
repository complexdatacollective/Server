/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import AppRoutes from '../AppRoutes';

jest.mock('../PairDevice', () => () => <div>Pair</div>);
jest.mock('../OverviewScreen', () => () => <div>Overview</div>);
jest.mock('../SettingsScreen', () => () => <div>Settings</div>);
jest.mock('../ExportScreen', () => () => <div>Export</div>);
jest.mock('../workspace/WorkspaceScreen', () => () => <div>Workspace</div>);

describe('<AppRoutes />', () => {
  let wrapper;
  const routesMatching = (routes, pattern) => (
    routes.findWhere(route => (new RegExp(pattern)).test(route.prop('path')))
  );

  beforeEach(() => {
    wrapper = shallow(<AppRoutes />);
  });

  it('should contain a dashboard overview', () => {
    expect(routesMatching(wrapper.find('Route'), '^/$')).toHaveLength(1);
  });

  it('should contain settings', () => {
    expect(routesMatching(wrapper.find('Route'), /settings/)).toHaveLength(1);
  });

  it('should contain data export', () => {
    expect(routesMatching(wrapper.find('Route'), /export/)).toHaveLength(1);
  });

  it('should contain case management', () => {
    expect(routesMatching(wrapper.find('Route'), /casemanagement/)).toHaveLength(1);
  });
});
