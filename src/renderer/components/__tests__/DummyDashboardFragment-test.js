/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import DummyDashboardFragment from '../DummyDashboardFragment';

describe('<DummyDashboardFragment />', () => {
  it('renders charts', () => {
    const wrapper = shallow(<DummyDashboardFragment />);
    expect(wrapper.find('PieChart')).toHaveLength(1);
    expect(wrapper.find('BarChart')).toHaveLength(1);
  });
});
