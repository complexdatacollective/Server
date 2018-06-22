/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import LineChart from '../LineChart';

describe('<LineChart />', () => {
  it('defines a Line series', () => {
    const wrapper = shallow(<LineChart data={[]} />);
    expect(wrapper.find('Line').length).toBeGreaterThanOrEqual(1);
  });
});
