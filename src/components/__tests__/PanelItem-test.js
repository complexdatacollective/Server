/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import PanelItem from '../PanelItem';

const mockProps = {
  label: 'foo',
  value: 'bar',
};

describe('<PanelItem />', () => {
  it('should render', () => {
    const subject = shallow((
      <PanelItem {...mockProps} />
    ));

    expect(subject).toMatchSnapshot();
  });
});
