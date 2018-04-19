/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';

import AppRoutes from '../AppRoutes';

describe('<AppRoutes />', () => {
  let wrapper;
  const routesMatching = (routes, pattern) => (
    routes.findWhere(route => (new RegExp(pattern)).test(route.prop('path')))
  );

  beforeEach(() => {
    wrapper = shallow(<AppRoutes />);
  });

  it('should contain a dashboard', () => {
    expect(routesMatching(wrapper.find('Route'), /dashboard/)).toHaveLength(1);
  });

  it('should contain settings', () => {
    expect(routesMatching(wrapper.find('Route'), /settings/)).toHaveLength(1);
  });

  // Not for Alpha.1
  // it('should contain data export', () => {
  //   expect(routesMatching(wrapper.find('Route'), /export/)).toHaveLength(1);
  // });

  it('should redirect to dashboard by default', () => {
    const defaultRedirect = wrapper.find(Redirect);
    expect(defaultRedirect).toHaveLength(1);
    expect(defaultRedirect.prop('to')).toMatch(/dashboard/);
  });
});
