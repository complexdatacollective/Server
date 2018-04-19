/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import OverviewScreen from '../OverviewScreen';
import AdminApiClient from '../../utils/adminApiClient';

jest.mock('../../utils/adminApiClient');

describe('<OverviewScreen />', () => {
  it('renders a chart', () => {
    const subject = shallow(<OverviewScreen />);
    expect(subject.find('BarChart').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a device list', () => {
    const subject = shallow(<OverviewScreen />);
    expect(subject.find('DeviceList')).toHaveLength(1);
  });

  it('requests devices to display', () => {
    expect(AdminApiClient().get).toHaveBeenCalledWith('/devices');
  });
});
