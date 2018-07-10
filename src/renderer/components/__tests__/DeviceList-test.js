/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';

import DeviceList from '../DeviceList';

describe('<DeviceList />', () => {
  it('renders device details', () => {
    const mockDevice = { id: '1', name: 'a', createdAt: new Date() };
    const wrapper = mount(<DeviceList devices={[mockDevice]} />);
    expect(wrapper.find('DeviceDetails')).toHaveLength(1);
  });

  it('renders an empty view when no devices saved', () => {
    const wrapper = shallow(<DeviceList devices={[]} />);
    expect(wrapper.find('EmptyDeviceList')).toHaveLength(1);
  });

  it('renders instructions when no devices saved', () => {
    const wrapper = mount(<DeviceList devices={[]} />);
    expect(wrapper.find('Instructions')).toHaveLength(1);
  });
});
