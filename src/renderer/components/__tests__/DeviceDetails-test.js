/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import DeviceDetails from '../DeviceDetails';

describe('<DeviceDetails />', () => {
  it('renders device name', () => {
    const mockDevice = { id: '1', name: 'a', createdAt: new Date() };
    const wrapper = shallow(<DeviceDetails device={mockDevice} />);
    expect(wrapper.text()).toContain(mockDevice.name);
  });
});
