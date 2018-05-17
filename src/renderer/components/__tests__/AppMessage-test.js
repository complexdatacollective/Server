/* eslint-env jest */
import React from 'react';
import { mount } from 'enzyme';
import AppMessage from '../AppMessage';

describe('<AppMessage />', () => {
  it('renders the given text', () => {
    const text = 'Error notification';
    const wrapper = mount(<AppMessage text={text} />);
    expect(wrapper.text()).toContain(text);
  });
});
