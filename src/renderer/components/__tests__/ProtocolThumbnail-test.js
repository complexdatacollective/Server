/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import ProtocolThumbnail from '../ProtocolThumbnail';

describe('<ProtocolThumbnail />', () => {
  it('renders some protocol info', () => {
    const mockProtocol = { id: '1', name: 'MyProtocol', createdAt: new Date(), version: '2.0' };
    const wrapper = shallow(<ProtocolThumbnail protocol={mockProtocol} />);
    expect(wrapper.text()).toContain(mockProtocol.name);
    expect(wrapper.text()).toContain(mockProtocol.version);
  });

  it('sets a hover state on mouse over', () => {
    const mockProtocol = { id: '1', name: 'MyProtocol', createdAt: new Date(), version: '2.0' };
    const wrapper = shallow(<ProtocolThumbnail protocol={mockProtocol} />);
    wrapper.simulate('mouseOver');
    expect(wrapper.state('hover')).toBe(true);
    wrapper.simulate('mouseOut');
    expect(wrapper.state('hover')).toBe(false);
  });
});
