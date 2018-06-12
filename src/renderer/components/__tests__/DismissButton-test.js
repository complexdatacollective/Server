/* eslint-env jest */
import React from 'react';
import { shallow } from 'enzyme';

import DismissButton from '../DismissButton';

describe('<DismissButton />', () => {
  const clickHandler = jest.fn();
  const title = 'my button title';
  let subject;
  beforeEach(() => {
    subject = shallow(<DismissButton title={title} onClick={clickHandler} />);
  });

  it('renders a title', () => {
    expect(subject.text()).toContain(title);
  });

  it('calls the click handler', () => {
    subject.simulate('click');
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('supports a small variant', () => {
    expect(subject.prop('className')).not.toMatch('--small');
    subject = shallow(<DismissButton small title={title} onClick={clickHandler} />);
    expect(subject.prop('className')).toMatch('--small');
  });

  it('supports an inline variant', () => {
    expect(subject.prop('className')).not.toMatch('--inline');
    subject = shallow(<DismissButton inline title={title} onClick={clickHandler} />);
    expect(subject.prop('className')).toMatch('--inline');
  });

  it('supports custom class names', () => {
    const cssClass = 'my-custom-btn';
    subject = shallow(<DismissButton className={cssClass} title={title} onClick={clickHandler} />);
    expect(subject.prop('className')).toMatch(cssClass);
  });
});
