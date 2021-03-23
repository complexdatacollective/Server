/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import PanelItem from '../PanelItem';

const mockProps = {
  label: 'almond',
  placeholder: 'n/a',
  value: 'marzipan',
};

describe('<PanelItem />', () => {
  it('should render label', () => {
    const subject = shallow(<PanelItem {...mockProps} />);
    expect(subject.text()).toContain(mockProps.label);
  });

  it('should render value', () => {
    const subject = shallow(<PanelItem {...mockProps} />);
    expect(subject.text()).toContain(mockProps.value);
    expect(subject.text()).not.toContain(mockProps.placeholder);
  });

  it('should render placeholder if value unavailable', () => {
    const placeholderProps = { ...mockProps, value: undefined };
    const subject = shallow(<PanelItem {...placeholderProps} />);
    expect(subject.text()).toContain(placeholderProps.placeholder);
  });
});
