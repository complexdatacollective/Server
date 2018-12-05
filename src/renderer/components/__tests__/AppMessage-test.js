/* eslint-env jest */
import React from 'react';
import { render, shallow } from 'enzyme';
import AppMessage from '../AppMessage';

describe('<AppMessage />', () => {
  const text = 'Mock notification';
  const handleDismissal = jest.fn();
  let component;

  beforeEach(() => {
    component = <AppMessage text={text} timestamp={1} handleDismissal={handleDismissal} />;
  });

  it('renders the given text', () => {
    expect(render(component).text()).toContain(text);
  });

  it('can be dismissed', () => {
    const wrapper = shallow(component);
    wrapper.find('button').simulate('click');
    expect(handleDismissal).toHaveBeenCalled();
  });
});
