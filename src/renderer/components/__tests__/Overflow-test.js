/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import Overflow from '../Overflow';

describe('<Overflow />', () => {
  it('renders children wrapped in an overflow class', () => {
    const child = <div id="__mock-div__" />;
    const wrapper = shallow(<Overflow>{child}</Overflow>);
    expect(wrapper.find('#__mock-div__')).toHaveLength(1);
    expect(wrapper.hasClass('overflow')).toBe(true);
  });

  it('supports sizing', () => {
    const child = <div id="__mock-div__" />;
    const wrapper = shallow(<Overflow size="huge">{child}</Overflow>);
    expect(wrapper.hasClass('overflow--huge')).toBe(true);
  });
});
