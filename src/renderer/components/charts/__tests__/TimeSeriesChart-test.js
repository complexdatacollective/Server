/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import TimeSeriesChart from '../TimeSeriesChart';

describe('<TimeSeriesChart />', () => {
  it('defines a Line series', () => {
    const wrapper = shallow(<TimeSeriesChart data={[{ value: 1 }]} dataKeys={['value']} />);
    expect(wrapper.find('Line').length).toBeGreaterThanOrEqual(1);
  });
});
