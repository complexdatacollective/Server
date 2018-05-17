/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import ProtocolThumbnail from '../ProtocolThumbnail';

describe('<ProtocolThumbnail />', () => {
  let mockProtocol;
  let wrapper;
  beforeEach(() => {
    mockProtocol = { id: '1', name: 'MyProtocol', createdAt: new Date(), version: '2.0' };
    wrapper = shallow(<ProtocolThumbnail protocol={mockProtocol} />);
  });

  it('renders a NavLink for navigation', () => {
    expect(wrapper.find('NavLink')).toHaveLength(1);
  });

  it('links to a protocol workspace', () => {
    expect(wrapper.find('NavLink').prop('to')).toMatch(`workspaces/${mockProtocol.id}`);
  });

  it('renders an abbreviated name as nav text', () => {
    const navText = wrapper.children().text();
    expect(navText).toMatch(new RegExp(`^${mockProtocol.name.substring(0, 1)}`));
    expect(navText).toHaveLength(2);
  });
});
