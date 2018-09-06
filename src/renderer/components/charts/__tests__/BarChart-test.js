/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import BarChart from '../BarChart';

describe('<BarChart />', () => {
  it('defines a Bar series', () => {
    const wrapper = shallow(<BarChart data={[{ name: 'a', val: 1 }]} dataKeys={['val']} />);
    expect(wrapper.find('Bar').length).toBeGreaterThanOrEqual(1);
  });
});
