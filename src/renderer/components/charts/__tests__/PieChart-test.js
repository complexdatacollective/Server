/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import PieChart from '../PieChart';

describe('<PieChart />', () => {
  it('defines a Pie component', () => {
    const wrapper = shallow(<PieChart data={[]} />);
    expect(wrapper.find('Pie').length).toBeGreaterThanOrEqual(1);
  });
});
