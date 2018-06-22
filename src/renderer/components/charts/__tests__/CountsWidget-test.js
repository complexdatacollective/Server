/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import CountsWidget from '../CountsWidget';

describe('<CountsWidget />', () => {
  it('renders name & value for each data item ', () => {
    const mockData = [{ name: 'a', value: 1 }, { name: 'b', value: 2 }];
    const wrapper = shallow(<CountsWidget data={mockData} />);
    expect(wrapper.find('h1')).toHaveLength(mockData.length);
    expect(wrapper.find('h4')).toHaveLength(mockData.length);
  });
});
