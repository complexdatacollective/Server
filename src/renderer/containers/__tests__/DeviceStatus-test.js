/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedDeviceStatus as DeviceStatus } from '../DeviceStatus';

jest.mock('../../utils/adminApiClient');

const mockDevice = { id: '1', name: '1', createdAt: new Date() };

describe('<DeviceStatus />', () => {
  const mockDevices = [mockDevice, mockDevice];

  it('renders the paired device count', () => {
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.text()).toMatch(new RegExp(`\\b${mockDevices.length}\\b`));
  });

  it('contains a device modal', () => {
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.find('PairedDeviceModal')).toHaveLength(1);
  });

  it('only shows the device modal on click', () => {
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.find('PairedDeviceModal').prop('show')).toBe(false);
    subject.find('button').simulate('click');
    expect(subject.find('PairedDeviceModal').prop('show')).toBe(true);
  });

  it('requests devices to display', () => {
    const mockLoader = jest.fn();
    shallow(<DeviceStatus loadDevices={mockLoader} />);
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });

  it('renders an empty badge before load', () => {
    const subject = shallow(<DeviceStatus devices={null} />);
    expect(subject.find('.device-icon__badge').text()).toEqual('');
  });

  it('renders a dark button variant', () => {
    const subject = shallow(<DeviceStatus dark />);
    const btnClass = subject.find('button').prop('className');
    expect(btnClass).toContain('--dark');
  });
});
