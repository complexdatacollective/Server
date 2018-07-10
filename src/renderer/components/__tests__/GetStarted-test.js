/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import GetStarted from '../GetStarted';

jest.mock('../../containers/DeviceStatus');

describe('GetStarted', () => {
  it('renders instructions', () => {
    const subject = shallow(<GetStarted />);
    expect(subject.find('Instructions')).toHaveLength(1);
  });

  it('renders a connected device status if one is paired', () => {
    const device = { id: '1', name: 'd', createdAt: new Date() };
    expect(shallow(<GetStarted />).find('DeviceStatus')).toHaveLength(0);
    expect(shallow(<GetStarted devices={[device]} />).find('Connect(DeviceStatus)')).toHaveLength(1);
  });
});
