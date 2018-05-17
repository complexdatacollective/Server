/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import OverviewScreen from '../OverviewScreen';

describe('<OverviewScreen />', () => {
  it('renders a chart', () => {
    const subject = shallow(<OverviewScreen />);
    expect(subject.find('BarChart').length).toBeGreaterThanOrEqual(1);
  });
});
