/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';
import InterviewWidget from '../InterviewWidget';

describe('<InterviewWidget />', () => {
  const mockCountsData = [];
  const mockData = [{ name: 'section1', data: mockCountsData }, { name: 'section2', data: mockCountsData }];

  it('renders Counts', () => {
    const wrapper = shallow(<InterviewWidget data={mockData} />);
    expect(wrapper.find('CountsWidget')).toHaveLength(mockData.length);
  });

  it('renders section titles ', () => {
    const wrapper = shallow(<InterviewWidget data={mockData} />);
    expect(wrapper.text()).toContain(mockData[0].name);
    expect(wrapper.text()).toContain(mockData[1].name);
  });
});
