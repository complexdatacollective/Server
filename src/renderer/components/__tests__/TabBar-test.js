/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import { UnconnectedTabBar as TabBar } from '../TabBar';

describe('<TabBar />', () => {
  it('renders links to main pages', () => {
    const mockMatch = { params: { id: '1' } };
    const wrapper = shallow(<TabBar match={mockMatch} />);
    const links = wrapper.find('NavLink');
    expect(links).toHaveLength(2);

    const labels = links.map(l => l.children().text());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Settings');
  });
});
