/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import EmptyData from '../EmptyData';

describe('<EmptyData />', () => {
  it('renders a message ', () => {
    const wrapper = shallow(<EmptyData />);
    expect(wrapper.text()).toMatch('No data');
  });
});
