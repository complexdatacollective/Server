/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import BarChart from '../BarChart';

describe('<BarChart />', () => {
  let props;
  beforeEach(() => {
    props = {
      data: [{ name: 'a', val: 1 }],
      dataKeys: ['val'],
    };
  });

  it('defines a Bar series', () => {
    const wrapper = shallow(<BarChart {...props} />);
    expect(wrapper.find('Bar').length).toBeGreaterThanOrEqual(1);
  });

  it('defaults to a decimal value axis', () => {
    const wrapper = shallow(<BarChart {...props} />);
    expect(wrapper.find('YAxis').prop('allowDecimals')).toBe(true);
  });

  it('supports an integer-only value axis', () => {
    props.allowDecimals = false;
    const wrapper = shallow(<BarChart {...props} />);
    expect(wrapper.find('YAxis').prop('allowDecimals')).toBe(false);
  });
});
