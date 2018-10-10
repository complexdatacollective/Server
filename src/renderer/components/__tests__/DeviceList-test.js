/* eslint-env jest */
import React from 'react';
import { mount, shallow } from 'enzyme';

import DeviceList from '../DeviceList';


describe('<DeviceList />', () => {
  const mockDevice = { id: '1', name: 'a', createdAt: new Date() };

  it('renders device details', () => {
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

  it('renders an unpair button when needed', () => {
    const wrapper = mount(<DeviceList devices={[mockDevice]} deleteDevice={() => {}} />);
    const button = wrapper.find('Button');
    expect(button).toHaveLength(1);
    expect(button.text()).toMatch('Unpair');
  });

  it('renders an unpair button when needed', () => {
    global.confirm = jest.fn().mockReturnValue(true);
    const deleteSpy = jest.fn();
    const wrapper = mount(<DeviceList devices={[mockDevice]} deleteDevice={deleteSpy} />);
    const button = wrapper.find('Button');
    button.simulate('click');
    expect(deleteSpy).toHaveBeenCalledWith(mockDevice.id);
  });
});
