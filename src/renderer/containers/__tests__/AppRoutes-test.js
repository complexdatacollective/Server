/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';
import { MemoryRouter, Redirect } from 'react-router';

import AppRoutes from '../AppRoutes';

jest.mock('../PairDevice');
jest.mock('../OverviewScreen');
jest.mock('../SettingsScreen');
jest.mock('../ExportScreen');
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
    expect(routesMatching(wrapper.find('Route'), /overview/)).toHaveLength(1);
  });

  it('should contain settings', () => {
    expect(routesMatching(wrapper.find('Route'), /settings/)).toHaveLength(1);
  });

  it('should contain data export', () => {
    expect(routesMatching(wrapper.find('Route'), /export/)).toHaveLength(1);
  });

  it('should redirect to overview by default', () => {
    const defaultRedirect = wrapper.find(Redirect);
    expect(defaultRedirect).toHaveLength(1);
    expect(defaultRedirect.prop('to')).toMatch(/overview/);
  });

  describe('workspaces route', () => {
    let screen;
    beforeEach(() => {
      const router = <MemoryRouter initialEntries={['/workspaces/1']}><AppRoutes /></MemoryRouter>;
      const subject = mount(router);
      screen = subject.find('main').find('Route').childAt(0);
    });

    it('mounts a WorkspaceScreen at the workspaces route', () => {
      expect(screen.text()).toMatch('Workspace');
    });

    it('provides WorkspaceScreen with a ref to the app’s scroll container', () => {
      expect(screen.prop('scrollContainerRef')).toHaveProperty('current');
    });
  });
});
