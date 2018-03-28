/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import TabBar from '../TabBar';

describe('<TabBar />', () => {
  it('renders links to main pages', () => {
    const wrapper = shallow(<TabBar />);
    const links = wrapper.find('NavLink');
    expect(links).toHaveLength(3);

    const labels = links.map(l => l.children().text());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Settings');
    expect(labels).toContain('Export Data');
  });
});
