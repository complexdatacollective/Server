/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import Expandable from '../Expandable';

describe('<Expandable />', () => {
  it('should render', () => {
    const subject = shallow((
      <Expandable className="foo">
        Bar
      </Expandable>
    ));

    expect(subject).toMatchSnapshot();
  });

  it('should have expandable classes', () => {
    const subject = shallow((
      <Expandable>
        Bar
      </Expandable>
    ));

    expect(subject.prop('className')).toEqual('expandable');

    subject.setProps({ className: 'foo' });

    expect(subject.prop('className')).toEqual('foo expandable');

    subject.setProps({ className: 'foo', open: true });

    expect(subject.prop('className')).toEqual('foo expandable expandable--open');
  });
});
