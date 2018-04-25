/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import { UnconnectedDeviceStatus as DeviceStatus } from '../DeviceStatus';

const mockDevice = { id: '1', name: '1', createdAt: new Date() };

describe('<DeviceStatus />', () => {
  it('renders the paired device count', () => {
    const mockDevices = [mockDevice, mockDevice];
    const subject = shallow(<DeviceStatus devices={mockDevices} />);
    expect(subject.text()).toMatch(new RegExp(`\\b${mockDevices.length}\\b`));
  });
});
