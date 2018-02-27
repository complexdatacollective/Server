/* eslint-env jest */

import React from 'react';
import { shallow } from 'enzyme';
import MenuItem from '../MenuItem';

const mockProps = {
  action: () => {},
};

describe('<MenuItem />', () => {
  it('should render', () => {
    const subject = shallow((
      <MenuItem {...mockProps}>
        Foo
      </MenuItem>
    ));

    expect(subject).toMatchSnapshot();
  });
});
