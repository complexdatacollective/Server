/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import Identicon from 'react-identicons';

import ProtocolThumbnail from '../ProtocolThumbnail';

describe('<ProtocolThumbnail />', () => {
  let mockProtocol;
  let wrapper;
  beforeEach(() => {
    mockProtocol = { id: '1', name: 'MyProtocol', createdAt: new Date(), schemaVersion: '2.0' };
    wrapper = shallow(<ProtocolThumbnail protocol={mockProtocol} />);
  });

  it('renders a NavLink for navigation', () => {
    expect(wrapper.find('NavLink')).toHaveLength(1);
  });

  it('links to a protocol workspace', () => {
    expect(wrapper.find('NavLink').prop('to')).toMatch(`workspaces/${mockProtocol.id}`);
  });

  it('renders an abbreviated name as nav text', () => {
    const navText = wrapper.children().find('span').text();
    expect(navText).toMatch(new RegExp(`^${mockProtocol.name.substring(0, 1)}`));
    expect(navText).toHaveLength(2);
  });

  it('uses identicons based on protocol name', () => {
    expect(wrapper.find('NavLink').prop('className')).toMatch('protocol-thumbnail');
    expect(wrapper.find(Identicon).prop('string')).toMatch(mockProtocol.name);
  });
});
