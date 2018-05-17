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

  it('renders a device list', () => {
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.find('PairedDeviceList')).toHaveLength(1);
  });

  it('only shows the device list on click', () => {
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.find('PairedDeviceList').prop('show')).toBe(false);
    subject.find('button').simulate('click');
    expect(subject.find('PairedDeviceList').prop('show')).toBe(true);
  });

  it('requests devices to display', () => {
    const mockLoader = jest.fn();
    shallow(<DeviceStatus loadDevices={mockLoader} />);
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });
});
